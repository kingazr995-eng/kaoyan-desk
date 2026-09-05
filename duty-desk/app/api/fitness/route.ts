import { NextRequest, NextResponse } from "next/server";
import { all, one, run, todayStr, daysAgoStr, getSetting, setSetting } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") || todayStr();
  const plan = (getSetting("fitness_plan") || "俯卧撑 3组x15\n深蹲 3组x20\n平板支撑 2组x60秒").split("\n").map((s) => s.trim()).filter(Boolean);
  const today = all("SELECT * FROM fitness_logs WHERE date = ? ORDER BY id", date);
  const history = all(
    "SELECT date, COUNT(*) AS count FROM fitness_logs WHERE date >= ? GROUP BY date ORDER BY date DESC",
    daysAgoStr(13)
  );
  return NextResponse.json({ plan, today, history, date });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "checkin");
  if (action === "save_plan") {
    setSetting("fitness_plan", String(body.plan || ""));
    return NextResponse.json({ ok: true });
  }
  const plan = String(body.plan || "").trim();
  if (!plan) return NextResponse.json({ error: "缺少计划项" }, { status: 400 });
  const date = todayStr();
  // 同一天同一项目去重（重新打卡=更新备注）
  run("DELETE FROM fitness_logs WHERE date = ? AND plan = ?", date, plan);
  run("INSERT INTO fitness_logs (plan, note, date) VALUES (?,?,?)", plan, String(body.note || ""), date);
  return NextResponse.json({ ok: true });
}
