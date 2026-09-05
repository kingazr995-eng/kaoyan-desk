import { NextRequest, NextResponse } from "next/server";
import { one, run, nowStr } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const status = String(body.status || "todo");
  if (!["todo", "done", "dropped"].includes(status)) {
    return NextResponse.json({ error: "非法状态" }, { status: 400 });
  }
  run(
    "UPDATE tasks SET status = ?, done_at = ? WHERE id = ?",
    status, status === "done" ? nowStr() : null, id
  );
  return NextResponse.json({ task: one("SELECT * FROM tasks WHERE id = ?", id) });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  run("DELETE FROM tasks WHERE id = ?", id);
  return NextResponse.json({ ok: true });
}
