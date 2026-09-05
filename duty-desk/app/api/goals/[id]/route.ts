import { NextRequest, NextResponse } from "next/server";
import { one, run, nowStr } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const g = one<any>("SELECT * FROM goals WHERE id = ?", id);
  if (!g) return NextResponse.json({ error: "目标不存在" }, { status: 404 });

  const next = { ...g };
  if (body.currentValue !== undefined) {
    const v = Math.max(0, Number(body.currentValue) || 0);
    run("UPDATE goals SET current_value = ? WHERE id = ?", v, id);
    next.current_value = v;
  }
  if (body.status && ["active", "done", "archived"].includes(body.status)) {
    run("UPDATE goals SET status = ?, review = COALESCE(?, review) WHERE id = ?", body.status, body.review || null, id);
    next.status = body.status;
    if (body.review !== undefined) next.review = body.review;
    if (body.status === "done" && !next.review) {
      run("UPDATE goals SET review = ? WHERE id = ?", "完成于 " + nowStr().slice(0, 10), id);
      next.review = "完成于 " + nowStr().slice(0, 10);
    }
  }
  if (body.review !== undefined && body.status === undefined) {
    run("UPDATE goals SET review = ? WHERE id = ?", body.review, id);
    next.review = body.review;
  }
  return NextResponse.json({ goal: one("SELECT * FROM goals WHERE id = ?", id) });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  run("DELETE FROM goals WHERE id = ?", id);
  return NextResponse.json({ ok: true });
}
