import { NextRequest, NextResponse } from "next/server";
import { one, run, todayStr, daysAgoStr } from "@/lib/db";
import { calcStudyStreak } from "@/lib/daily";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") || todayStr();
  let card = one("SELECT * FROM daily_cards WHERE date = ?", date);
  if (!card) {
    run("INSERT INTO daily_cards (date) VALUES (?)", date);
    card = one("SELECT * FROM daily_cards WHERE date = ?", date);
  }
  const streak = calcStudyStreak();
  const isSunday = new Date().getDay() === 0;
  const y = one("SELECT note FROM daily_cards WHERE date = ?", daysAgoStr(1));
  return NextResponse.json({ card, streak, isSunday, date, yesterdayNote: y?.note || null });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const date = String(body.date || todayStr());
  run(
    `INSERT INTO daily_cards (date, task1, task2, task3, done1, done2, done3, note)
     VALUES (?,?,?,?,?,?,?,?)
     ON CONFLICT(date) DO UPDATE SET
       task1=excluded.task1, task2=excluded.task2, task3=excluded.task3,
       done1=excluded.done1, done2=excluded.done2, done3=excluded.done3,
       note=excluded.note`,
    date,
    String(body.task1 ?? "").trim(), String(body.task2 ?? "").trim(), String(body.task3 ?? "").trim(),
    body.done1 ? 1 : 0, body.done2 ? 1 : 0, body.done3 ? 1 : 0,
    String(body.note ?? "").trim()
  );
  const card = one("SELECT * FROM daily_cards WHERE date = ?", date);
  return NextResponse.json({ card, streak: calcStudyStreak() });
}
