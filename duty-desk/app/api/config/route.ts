import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting, run } from "@/lib/db";
import { getApiKey } from "@/lib/deepseek";

export const dynamic = "force-dynamic";

export async function GET() {
  const key = getApiKey();
  const source = process.env.DEEPSEEK_API_KEY?.trim() ? "env" : key ? "db" : null;
  const mask = key ? `${key.slice(0, 6)}…${key.slice(-4)}` : null;
  let profile: any = null;
  try { profile = JSON.parse(getSetting("profile") || "null"); } catch { /* 忽略 */ }
  return NextResponse.json({
    hasKey: !!key,
    keyMask: mask,
    source,
    examDate: getSetting("exam_date") || null,
    profile,
    hasDav: !!(getSetting("dav_user") && getSetting("dav_pass")),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  // 初试日期（考研倒计时）
  if (body.examDate !== undefined) {
    const d = String(body.examDate || "").trim();
    if (d) setSetting("exam_date", d);
    else run("DELETE FROM settings WHERE key = 'exam_date'");
    return NextResponse.json({ ok: true, examDate: getSetting("exam_date") || null });
  }
  if (body.profile !== undefined) {
    setSetting("profile", JSON.stringify(body.profile || {}));
    return NextResponse.json({ ok: true, profile: body.profile || {} });
  }
  if (body.davUser !== undefined && body.davPass !== undefined) {
    if (body.davUser && body.davPass) {
      setSetting("dav_user", String(body.davUser));
      setSetting("dav_pass", String(body.davPass));
    } else {
      run("DELETE FROM settings WHERE key IN ('dav_user','dav_pass')");
    }
    return NextResponse.json({ ok: true, hasDav: !!(body.davUser && body.davPass) });
  }
  const apiKey = String(body.apiKey || "").trim();
  if (!apiKey) {
    run("DELETE FROM settings WHERE key = 'api_key'");
    return NextResponse.json({ ok: true, hasKey: false });
  }
  run(
    "INSERT INTO settings (key, value) VALUES ('api_key', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    apiKey
  );
  return NextResponse.json({ ok: true, hasKey: true });
}
