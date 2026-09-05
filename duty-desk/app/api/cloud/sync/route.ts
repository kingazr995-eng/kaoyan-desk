import { NextRequest, NextResponse } from "next/server";
import { all, db } from "@/lib/db";
import { davPut, davGet, davMkdir, hasDav } from "@/lib/webdav";

export const dynamic = "force-dynamic";

const TABLES = ["tasks", "pomodoros", "interruptions", "fitness_logs", "notes", "chat_messages", "settings", "goals", "daily_cards", "study_logs", "plans"];
const FILE = "/duty-desk/data.json";

function exportAll(): string {
  const data: Record<string, any[]> = {};
  for (const t of TABLES) data[t] = all(`SELECT * FROM ${t}`);
  return JSON.stringify(data);
}

function importAll(raw: string) {
  const data = JSON.parse(raw);
  db.exec("BEGIN");
  try {
    for (const t of TABLES) {
      db.exec(`DELETE FROM ${t}`);
      const rows = data[t] || [];
      if (!rows.length) continue;
      const cols = Object.keys(rows[0]);
      const ph = cols.map(() => "?").join(",");
      const stmt = db.prepare(`INSERT INTO ${t} (${cols.join(",")}) VALUES (${ph})`);
      for (const row of rows) stmt.run(...cols.map((c) => row[c]));
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "push");
  if (!hasDav()) return NextResponse.json({ error: "未配置坚果云账号（设置页填）" }, { status: 400 });

  if (action === "push") {
    await davMkdir("/duty-desk/");
    const ok = await davPut(FILE, exportAll());
    return NextResponse.json({ ok, action: "push", at: new Date().toISOString() });
  }
  if (action === "pull") {
    const raw = await davGet(FILE);
    if (!raw) return NextResponse.json({ error: "云端还没有数据，先 push 一次" }, { status: 400 });
    try {
      importAll(raw);
    } catch (e: any) {
      return NextResponse.json({ error: "云端数据解析失败：" + e.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, action: "pull", at: new Date().toISOString() });
  }
  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}
