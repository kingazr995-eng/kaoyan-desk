import { NextRequest, NextResponse } from "next/server";
import { all, one, run, todayStr } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") || todayStr();
  const tasks = all(
    "SELECT * FROM tasks WHERE task_date = ? AND status != 'dropped' ORDER BY CASE status WHEN 'todo' THEN 0 ELSE 1 END, id DESC",
    date
  );
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "任务内容不能为空" }, { status: 400 });
  const subject = String(body.subject || "other");
  const plannedMin = Math.min(180, Math.max(5, Number(body.plannedMin) || 25));
  const date = String(body.date || todayStr());
  const r = run(
    "INSERT INTO tasks (title, subject, planned_min, task_date) VALUES (?,?,?,?)",
    title, subject, plannedMin, date
  );
  const task = one("SELECT * FROM tasks WHERE id = ?", r.lastInsertRowid);
  return NextResponse.json({ task });
}
