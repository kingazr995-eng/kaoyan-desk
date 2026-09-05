import { NextRequest, NextResponse } from "next/server";
import { all, one, run } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const goals = all("SELECT * FROM goals ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'done' THEN 1 ELSE 2 END, id DESC");
  return NextResponse.json({ goals });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "目标名称不能为空" }, { status: 400 });
  const r = run(
    "INSERT INTO goals (title, target_value, current_value, unit, period, deadline) VALUES (?,?,?,?,?,?)",
    title,
    Number(body.targetValue) || 1,
    Number(body.currentValue) || 0,
    String(body.unit || "次"),
    String(body.period || "周"),
    String(body.deadline || "").trim() || null
  );
  return NextResponse.json({ goal: one("SELECT * FROM goals WHERE id = ?", r.lastInsertRowid) });
}
