import { NextRequest, NextResponse } from "next/server";
import { all, todayStr } from "@/lib/db";

export const dynamic = "force-dynamic";

// 今日动态：番茄/记录/打卡 合并时间轴
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") || todayStr();
  const rows = all(
    `SELECT * FROM (
      SELECT 'pomo' AS type, id, task_title AS title, created_at FROM pomodoros WHERE status = 'done' AND date(created_at) = ?
      UNION ALL
      SELECT 'note', id, content, created_at FROM notes WHERE kind IN ('quick','fde') AND date(created_at) = ?
      UNION ALL
      SELECT 'fitness', id, plan, created_at FROM fitness_logs WHERE date = ?
    ) ORDER BY created_at DESC LIMIT 30`,
    date, date, date
  );
  return NextResponse.json({ items: rows, date });
}
