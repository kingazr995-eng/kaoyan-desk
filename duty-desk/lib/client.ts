// 前端数据层：本地优先（手机/PWA 打开即用），电脑在线时手动/自动同步
const SNAPSHOT_PREFIX = "desk_snap:";
const OPS_KEY = "desk_ops";
const SERVER_KEY = "desk_server";

function cacheSnapshot(path: string, data: any) {
  try { localStorage.setItem(SNAPSHOT_PREFIX + path, JSON.stringify(data)); } catch { /* 忽略 */ }
}
function loadSnapshot(path: string): any | null {
  try { const s = localStorage.getItem(SNAPSHOT_PREFIX + path); return s ? JSON.parse(s) : null; } catch { return null; }
}
function queueOp(path: string, method: string, body: any) {
  try {
    const ops = JSON.parse(localStorage.getItem(OPS_KEY) || "[]");
    ops.push({ path, method, body, ts: Date.now() });
    localStorage.setItem(OPS_KEY, JSON.stringify(ops));
  } catch { /* 忽略 */ }
}

// 手机（APK/PWA standalone）→ 本地优先；电脑浏览器 → 在线优先
function isLocalFirst(): boolean {
  try {
    const cap = (window as any).Capacitor;
    if (cap?.isNativePlatform?.()) return true;
    if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  } catch { /* 忽略 */ }
  return false;
}

function baseUrl(): string {
  // 只有手机端（APK/PWA）才需要指向电脑地址；电脑本机浏览器用相对路径即可
  if (!isLocalFirst()) return "";
  try { return localStorage.getItem(SERVER_KEY) || ""; } catch { return ""; }
}

// 本地配置（设置页：手机本地也能独立读写）
const CONFIG_KEY = "desk_config";
function loadLocalConfig(): any {
  try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}"); } catch { return {}; }
}
function saveLocalConfig(patch: any): any {
  const merged = { ...loadLocalConfig(), ...patch };
  if (patch.apiKey === "") delete merged.apiKey;
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(merged)); } catch { /* 忽略 */ }
  return merged;
}
function buildConfigResp(cfg: any): any {
  const key = cfg.apiKey || null;
  return {
    ok: true,
    hasKey: !!key,
    keyMask: key ? key.slice(0, 6) + "…" + key.slice(-4) : null,
    source: key ? "local" : null,
    examDate: cfg.examDate || null,
    profile: cfg.profile || null,
  };
}

// 写操作的本地乐观更新：返回"更新后的快照"（作为 API 响应的替代）
function applyLocalWrite(path: string, body: any): any {
  if (path === "/api/config") {
    const merged = saveLocalConfig(body);
    cacheSnapshot("/api/config", buildConfigResp(merged));
    return buildConfigResp(merged);
  }
  if (path === "/api/daily") {
    const snap = loadSnapshot("/api/daily") || {};
    snap.card = { ...(snap.card || {}), ...body };
    cacheSnapshot("/api/daily", snap);
    return snap;
  }
  if (path === "/api/study") {
    const snap = loadSnapshot("/api/study") || { week: [], signedDays: 0 };
    snap.today = { date: body.date || new Date().toISOString().slice(0, 10), content: body.content, subject: body.subject };
    cacheSnapshot("/api/study", snap);
    return snap;
  }
  if (path === "/api/tasks") {
    const snap = loadSnapshot("/api/tasks") || { tasks: [] };
    snap.tasks = [{ id: -Date.now(), ...body, status: "todo" }, ...(snap.tasks || [])];
    cacheSnapshot("/api/tasks", snap);
    return snap;
  }
  if (path === "/api/notes") {
    const key = "/api/notes?kind=" + (body.kind === "fde" ? "fde" : "quick");
    const snap = loadSnapshot(key) || { notes: [] };
    snap.notes = [{ id: -Date.now(), ...body, created_at: new Date().toISOString().slice(0, 16) }, ...(snap.notes || [])];
    cacheSnapshot(key, snap);
    return snap;
  }
  return {};
}

export class OfflineQueuedError extends Error {
  constructor() { super("已保存到本机，同步后合并到电脑"); this.name = "OfflineQueuedError"; }
}

export async function api(path: string, opts: { method?: string; body?: any } = {}) {
  const method = opts.method || "GET";
  const base = baseUrl();
  const url = base ? base + path : path;

  if (method === "GET") {
    if (isLocalFirst()) {
      // 本地优先：有快照立即返回，后台刷新
      const cached = loadSnapshot(path);
      if (cached) {
        (async () => {
          try {
            const r = await fetch(url);
            if (r.ok) cacheSnapshot(path, await r.json());
          } catch { /* 忽略 */ }
        })();
        return cached;
      }
    }
    try {
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `请求失败（${res.status}）`);
      cacheSnapshot(path, data);
      return data;
    } catch (e: any) {
      if (path === "/api/config") return buildConfigResp(loadLocalConfig());
      const cached = loadSnapshot(path);
      if (cached) return cached;
      throw e;
    }
  }

  // 写操作
  queueOp(path, method, opts.body);
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `请求失败（${res.status}）`);
    // 同步成功：移除对应待同步项
    try {
      const ops = JSON.parse(localStorage.getItem(OPS_KEY) || "[]");
      localStorage.setItem(OPS_KEY, JSON.stringify(ops.filter((o: any) => !(o.path === path && o.ts === (ops as any[]).at(-1)?.ts))));
    } catch { /* 忽略 */ }
    cacheSnapshot(path, data);
    return data;
  } catch {
    // 离线：本地乐观更新 + 返回本地数据
    return applyLocalWrite(path, opts.body);
  }
}

export function getPendingCount(): number {
  try { return JSON.parse(localStorage.getItem(OPS_KEY) || "[]").length; } catch { return 0; }
}

export function setServerAddress(addr: string) {
  try { localStorage.setItem(SERVER_KEY, addr.replace(/\/$/, "")); } catch { /* 忽略 */ }
}
export function getServerAddress(): string {
  return baseUrl();
}

export async function isOnline(): Promise<boolean> {
  try { const r = await fetch(baseUrl() + "/api/ping", { cache: "no-store" }); return r.ok; } catch { return false; }
}

// 手动同步：把本地待同步操作推到电脑
export async function syncNow(): Promise<number> {
  try {
    const ops = JSON.parse(localStorage.getItem(OPS_KEY) || "[]");
    if (!ops.length) return 0;
    const res = await fetch(baseUrl() + "/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ops }),
    });
    const data = await res.json();
    if (res.ok && data.applied > 0) {
      localStorage.removeItem(OPS_KEY);
      return data.applied;
    }
    return 0;
  } catch { return 0; }
}

export function fmtMin(min: number): string {
  if (min >= 60) { const h = Math.floor(min / 60); const m = min % 60; return m > 0 ? `${h}h${m}m` : `${h}h`; }
  return `${min}分钟`;
}
export function fmtTime(t: string | null | undefined): string { if (!t) return ""; return t.slice(11, 16); }
export function mmss(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
