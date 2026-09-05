// 坚果云 WebDAV 封装（云端同步用）
// 账号已固化：打开即可同步，无需手动填写（可在设置页覆盖）
import { getSetting, all } from "./db";

const DAV = "https://dav.jianguoyun.com/dav";
const DEFAULT_USER = "3612613692@qq.com";
const DEFAULT_PASS = "arwjxf8cnut67e2v";

function authHeader(): string | null {
  const user = getSetting("dav_user") || DEFAULT_USER;
  const pass = getSetting("dav_pass") || DEFAULT_PASS;
  if (!user || !pass) return null;
  return "Basic " + Buffer.from(user + ":" + pass).toString("base64");
}

export function hasDav(): boolean {
  return true; // 账号已固化，始终可用
}

// 上传文件
export async function davPut(path: string, content: string): Promise<boolean> {
  const auth = authHeader();
  if (!auth) return false;
  try {
    const res = await fetch(DAV + path, {
      method: "PUT",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: content,
    });
    return res.ok;
  } catch { return false; }
}

// 下载文件
export async function davGet(path: string): Promise<string | null> {
  const auth = authHeader();
  if (!auth) return null;
  try {
    const res = await fetch(DAV + path, { headers: { Authorization: auth } });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
}

// 创建目录（已存在返回 true）
export async function davMkdir(path: string): Promise<boolean> {
  const auth = authHeader();
  if (!auth) return false;
  try {
    const res = await fetch(DAV + path, { method: "MKCOL", headers: { Authorization: auth } });
    return res.ok || res.status === 405;
  } catch { return false; }
}

// 导出本地全部数据为 JSON（供云同步用）
export function exportAllData(): string {
  const tables = ["tasks", "pomodoros", "interruptions", "fitness_logs", "notes", "chat_messages", "settings", "goals", "daily_cards", "study_logs", "plans"];
  const data: Record<string, any[]> = {};
  for (const t of tables) data[t] = all(`SELECT * FROM ${t}`);
  return JSON.stringify(data);
}
