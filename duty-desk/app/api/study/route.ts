import { NextRequest, NextResponse } from "next/server";
import { all, one, run, todayStr } from "@/lib/db";

export const dynamic = "force-dynamic";

function fmtDate(x: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
}

// 本周（周一到周日）日期列表
function weekDates(): string[] {
  const d = new Date();
  const day = d.getDay(); // 0=周日
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    dates.push(fmtDate(x));
  }
  return dates;
}

const WEEKDAY = ["一", "二", "三", "四", "五", "六", "日"];

export async function GET() {
  const dates = weekDates();
  const logs = all("SELECT * FROM study_logs WHERE date BETWEEN ? AND ?", dates[0], dates[6]);
  const map = new Map(logs.map((l: any) => [String(l.date), l]));
  const today = todayStr();
  const week = dates.map((dt, i) => ({
    date: dt,
    weekday: WEEKDAY[i],
    content: map.get(dt)?.content || null,
    isToday: dt === today,
  }));
  const todayLog = map.get(today) || null;
  return NextResponse.json({ today: todayLog, week, signedDays: logs.length });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const content = String(body.content || "").trim();
  const date = String(body.date || todayStr());
  const subject = String(body.subject || "other");
  if (!content) return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
  run(
    `INSERT INTO study_logs (date, content, subject) VALUES (?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET content = excluded.content, subject = excluded.subject`,
    date, content, subject
  );
  const log = one("SELECT * FROM study_logs WHERE date = ?", date);
  return NextResponse.json({ today: log });
}
