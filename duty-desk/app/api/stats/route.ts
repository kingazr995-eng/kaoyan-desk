import { NextRequest, NextResponse } from "next/server";
import { all, one, todayStr, daysAgoStr } from "@/lib/db";
import { calcStudyStreak } from "@/lib/daily";

export const dynamic = "force-dynamic";

// 连续打卡天数（健身）
function calcFitnessStreak(): number {
  const days = all("SELECT DISTINCT date FROM fitness_logs ORDER BY date DESC");
  const set = new Set(days.map((d: any) => String(d.date)));
  const p = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  let streak = 0;
  const d = new Date();
  if (!set.has(p(d))) d.setDate(d.getDate() - 1);
  while (set.has(p(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export async function GET(req: NextRequest) {
  const days = Math.min(30, Math.max(1, Number(req.nextUrl.searchParams.get("days") || 7)));
  const start = daysAgoStr(days - 1);
  const prevStart = daysAgoStr(days * 2 - 1);
  const today = todayStr();

  const focus = all(
    "SELECT subject, SUM(length_min) AS minutes, COUNT(*) AS count FROM pomodoros WHERE status = 'done' AND date(created_at) >= ? GROUP BY subject",
    start
  );
  const prevFocus = all(
    "SELECT subject, SUM(length_min) AS minutes FROM pomodoros WHERE status = 'done' AND date(created_at) >= ? AND date(created_at) < ? GROUP BY subject",
    prevStart, start
  );
  const todayFocus = all(
    "SELECT subject, SUM(length_min) AS minutes, COUNT(*) AS count FROM pomodoros WHERE status = 'done' AND date(created_at) = ? GROUP BY subject",
    today
  );

  const fitnessCount = one<{ count: number }>(
    "SELECT COUNT(*) AS count FROM fitness_logs WHERE date >= ?", start
  )?.count || 0;
  const notesCount = one<{ count: number }>(
    "SELECT COUNT(*) AS count FROM notes WHERE date(created_at) >= ?", start
  )?.count || 0;
  const pomoCount = one<{ count: number }>(
    "SELECT COUNT(*) AS count FROM pomodoros WHERE status = 'done' AND date(created_at) >= ?", start
  )?.count || 0;
  const sessions = all(
    "SELECT * FROM pomodoros WHERE status = 'done' AND date(created_at) >= ? ORDER BY created_at DESC LIMIT 100",
    start
  );

  // 本周三件完成率 + 签到天数
  const d = new Date();
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  const ws = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
  const weekCards = all("SELECT * FROM daily_cards WHERE date >= ?", ws);
  const weekTotal = weekCards.filter((c: any) => c.task1 || c.task2 || c.task3).length;
  const weekDone = weekCards.filter((c: any) => c.done1 && c.done2 && c.done3 && (c.task1 || c.task2 || c.task3)).length;
  const signedDays = one<{ count: number }>(
    "SELECT COUNT(*) AS count FROM study_logs WHERE date >= ?", ws
  )?.count || 0;

  return NextResponse.json({
    days, start, today,
    streak: calcFitnessStreak(),
    studyStreak: calcStudyStreak(),
    focus, prevFocus, todayFocus,
    fitnessCount, notesCount, pomoCount,
    weekTotal, weekDone, signedDays,
    sessions,
  });
}
