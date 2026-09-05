import { NextRequest, NextResponse } from "next/server";
import { all, one, run } from "@/lib/db";

export const dynamic = "force-dynamic";

function fmtDate(x: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
}
function weekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return fmtDate(monday);
}
function monthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export async function GET() {
  const month = one("SELECT * FROM plans WHERE period = 'month' AND period_start = ?", monthStart());
  const week = one("SELECT * FROM plans WHERE period = 'week' AND period_start = ?", weekStart());
  return NextResponse.json({ month: month || null, week: week || null });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const period = body.period === "month" ? "month" : "week";
  const content = String(body.content || "").trim();
  if (!content) return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
  const periodStart = period === "month" ? monthStart() : weekStart();
  run(
    `INSERT INTO plans (period, period_start, content) VALUES (?,?,?)
     ON CONFLICT(period, period_start) DO UPDATE SET content = excluded.content`,
    period, periodStart, content
  );
  return NextResponse.json({ ok: true, plan: one("SELECT * FROM plans WHERE period=? AND period_start=?", period, periodStart) });
}
