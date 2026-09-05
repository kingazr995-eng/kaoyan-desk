import { DatabaseSync } from "node:sqlite";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

// 数据文件：data/desk.db（Node 26 内置 SQLite，零原生依赖）
const dataDir = path.join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(path.join(dataDir, "desk.db"));

// 忙等超时：多进程（如 next build 的 worker）并发打开时避免 "database is locked"
db.exec("PRAGMA busy_timeout = 10000;");
try {
  db.exec("PRAGMA journal_mode = WAL;");
} catch {
  // WAL 切换需要独占锁，竞争时忽略（默认模式也能用）
}
db.exec("PRAGMA foreign_keys = ON;");

// schema 初始化（含简单重试，防并发建表竞争）
function initSchema() {
  db.exec(`
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT 'other',
  planned_min INTEGER NOT NULL DEFAULT 25,
  status TEXT NOT NULL DEFAULT 'todo',
  task_date TEXT NOT NULL,
  done_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE TABLE IF NOT EXISTS pomodoros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER,
  task_title TEXT,
  subject TEXT NOT NULL DEFAULT 'other',
  length_min INTEGER NOT NULL DEFAULT 25,
  remaining_sec INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TEXT,
  ended_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE TABLE IF NOT EXISTS interruptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pomodoro_id INTEGER,
  type TEXT NOT NULL DEFAULT 'work',
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE TABLE IF NOT EXISTS fitness_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  date TEXT NOT NULL DEFAULT (date('now','localtime'))
);
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'quick',
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  target_value REAL NOT NULL DEFAULT 1,
  current_value REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '次',
  period TEXT NOT NULL DEFAULT '周',
  deadline TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  review TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE TABLE IF NOT EXISTS daily_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  task1 TEXT, task2 TEXT, task3 TEXT,
  done1 INTEGER NOT NULL DEFAULT 0,
  done2 INTEGER NOT NULL DEFAULT 0,
  done3 INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE TABLE IF NOT EXISTS study_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT 'other',
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period TEXT NOT NULL DEFAULT 'week',
  period_start TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  UNIQUE(period, period_start)
);
`);
}
for (let i = 0; i < 5; i++) {
  try {
    initSchema();
    break;
  } catch (e: any) {
    if (i === 4) throw e;
    new Promise((res) => setTimeout(res, 300 * (i + 1)));
  }
}

// 列迁移：study_logs.subject（兼容旧库）
(function migrate() {
  const cols = db.prepare("PRAGMA table_info(study_logs)").all() as any[];
  if (!cols.some((c: any) => c.name === "subject")) {
    db.exec("ALTER TABLE study_logs ADD COLUMN subject TEXT NOT NULL DEFAULT 'other'");
  }
})();

// ---------- 工具 ----------
export function nowStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
export function todayStr(): string {
  return nowStr().slice(0, 10);
}
export function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function all<T = any>(sql: string, ...params: any[]): T[] {
  return db.prepare(sql).all(...params) as T[];
}
export function one<T = any>(sql: string, ...params: any[]): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined;
}
export function run(sql: string, ...params: any[]) {
  const r = db.prepare(sql).run(...params);
  scheduleBackup();
  return r;
}

// ===== 自动备份（写后防抖导出 Markdown，兜住 100 天数据） =====
let backupTimer: any = null;
function scheduleBackup() {
  if (backupTimer) clearTimeout(backupTimer);
  backupTimer = setTimeout(backupNow, 3000);
}
function backupNow() {
  try {
    const t = todayStr();
    const lines: string[] = [`# 考研工作台备份 ${t}`, ""];
    const cards = all("SELECT * FROM daily_cards ORDER BY date DESC");
    const map = new Map(cards.map((c: any) => [String(c.date), c]));
    const isComplete = (c: any) => !!(c && c.done1 && c.done2 && c.done3 && (c.task1 || c.task2 || c.task3));
    const fd = (x: Date) => {
      const p = (n: number) => String(n).padStart(2, "0");
      return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
    };
    const d = new Date();
    if (!isComplete(map.get(fd(d)))) d.setDate(d.getDate() - 1);
    let streak = 0;
    while (isComplete(map.get(fd(d)))) { streak++; d.setDate(d.getDate() - 1); }
    lines.push(`- 连续学习：${streak} 天`);
    const logs = all("SELECT * FROM study_logs WHERE date >= ? ORDER BY date", daysAgoStr(6));
    lines.push(`- 本周签到：${logs.length} 天`);
    for (const l of logs as any[]) lines.push(`  - ${l.date}：${l.content}`);
    const goals = all("SELECT * FROM goals WHERE status = 'active'");
    if (goals.length) {
      lines.push("");
      lines.push("## 目标进度");
      for (const g of goals as any[]) lines.push(`- ${g.title}：${g.current_value}/${g.target_value}${g.unit}`);
    }
    const focus = all("SELECT subject, SUM(length_min) AS m FROM pomodoros WHERE status='done' AND date(created_at) >= ? GROUP BY subject", daysAgoStr(6));
    if (focus.length) {
      lines.push("");
      lines.push("## 近7天投入");
      for (const f of focus as any[]) lines.push(`- ${f.subject}：${Math.round((f.m / 60) * 10) / 10}h`);
    }
    mkdirSync(path.join(dataDir, "backup"), { recursive: true });
    writeFileSync(path.join(dataDir, "backup", t + ".md"), lines.join("\n"), "utf-8");
  } catch { /* 备份失败不阻断业务 */ }
}

export function getSetting(key: string): string | null {
  const row = one<{ value: string }>("SELECT value FROM settings WHERE key = ?", key);
  return row ? row.value : null;
}
export function setSetting(key: string, value: string) {
  run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", key, value);
}
