import { NextRequest, NextResponse } from "next/server";
import { all, one, run, todayStr, nowStr } from "@/lib/db";

export const dynamic = "force-dynamic";

// 计算一个会话当前剩余秒数
function remainingSec(p: any): number {
  const len = Number(p.length_min) * 60;
  if (p.status === "paused") return Number(p.remaining_sec);
  if (!p.started_at) return len;
  const elapsed = Math.floor((Date.now() - new Date(p.started_at.replace(" ", "T")).getTime()) / 1000);
  return Math.max(0, len - elapsed);
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("active") === "1") {
    const p = one(
      "SELECT * FROM pomodoros WHERE status IN ('running','paused') ORDER BY id DESC LIMIT 1"
    );
    if (!p) return NextResponse.json({ session: null });
    return NextResponse.json({ session: { ...p, remaining_sec: remainingSec(p) } });
  }
  const date = req.nextUrl.searchParams.get("date") || todayStr();
  const sessions = all(
    "SELECT * FROM pomodoros WHERE date(created_at) = ? ORDER BY id DESC LIMIT 50",
    date
  );
  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const taskTitle = String(body.task_title || body.title || "自由专注").trim();
  const subject = String(body.subject || "other");
  const lengthMin = Math.min(120, Math.max(1, Number(body.length_min) || 25));
  const taskId = body.task_id ? Number(body.task_id) : null;

  // 已有进行中的会话：自动暂停（防止双计时）
  const active = one("SELECT * FROM pomodoros WHERE status = 'running' ORDER BY id DESC LIMIT 1");
  if (active) {
    const rem = remainingSec(active);
    run("UPDATE pomodoros SET status = 'paused', remaining_sec = ? WHERE id = ?", rem, active.id);
  }

  const r = run(
    "INSERT INTO pomodoros (task_id, task_title, subject, length_min, remaining_sec, status, started_at) VALUES (?,?,?,?,?, 'running', ?)",
    taskId, taskTitle, subject, lengthMin, lengthMin * 60, nowStr()
  );
  const session = one("SELECT * FROM pomodoros WHERE id = ?", r.lastInsertRowid);
  return NextResponse.json({ session: { ...session, remaining_sec: lengthMin * 60 } });
}
