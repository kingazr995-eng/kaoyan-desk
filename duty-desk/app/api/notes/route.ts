import { NextRequest, NextResponse } from "next/server";
import { all, one, run } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get("kind") || "quick";
  const notes = all(
    "SELECT * FROM notes WHERE kind = ? ORDER BY id DESC LIMIT 200",
    kind
  );
  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const content = String(body.content || "").trim();
  if (!content) return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
  const kind = body.kind === "fde" ? "fde" : "quick";
  const r = run("INSERT INTO notes (content, kind) VALUES (?,?)", content, kind);
  return NextResponse.json({ note: one("SELECT * FROM notes WHERE id = ?", r.lastInsertRowid) });
}
