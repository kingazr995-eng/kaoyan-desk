import { NextRequest, NextResponse } from "next/server";
import { all, one, run, nowStr } from "@/lib/db";

export const dynamic = "force-dynamic";

function remainingSec(p: any): number {
  const len = Number(p.length_min) * 60;
  if (p.status === "paused") return Number(p.remaining_sec);
  if (!p.started_at) return len;
  const elapsed = Math.floor((Date.now() - new Date(p.started_at.replace(" ", "T")).getTime()) / 1000);
  return Math.max(0, len - elapsed);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const p = one("SELECT * FROM pomodoros WHERE id = ?", id);
  if (!p) return NextResponse.json({ error: "会话不存在" }, { status: 404 });

  switch (action) {
    case "pause": {
      const rem = remainingSec(p);
      run("UPDATE pomodoros SET status = 'paused', remaining_sec = ? WHERE id = ?", rem, id);
      break;
    }
    case "resume": {
      const rem = remainingSec(p);
      const startedAt = nowStr();
      const backdate = Math.floor((Number(p.length_min) * 60 - rem) * 1000);
      const d = new Date(Date.now() - backdate);
      const pad = (n: number) => String(n).padStart(2, "0");
      const start = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      run(
        "UPDATE pomodoros SET status = 'running', started_at = ?, remaining_sec = ? WHERE id = ?",
        start, Number(p.length_min) * 60, id
      );
      void startedAt;
      break;
    }
    case "done": {
      run("UPDATE pomodoros SET status = 'done', ended_at = ? WHERE id = ?", nowStr(), id);
      break;
    }
    case "skip": {
      run("UPDATE pomodoros SET status = 'skipped', ended_at = ? WHERE id = ?", nowStr(), id);
      break;
    }
    case "interrupt": {
      const rem = remainingSec(p);
      const type = String(body.type || "work");
      const note = String(body.note || "").trim();
      run(
        "INSERT INTO interruptions (pomodoro_id, type, note) VALUES (?,?,?)",
        id, type, note || null
      );
      run("UPDATE pomodoros SET status = 'paused', remaining_sec = ?, notes = ? WHERE id = ?", rem, note || null, id);
      break;
    }
    default:
      return NextResponse.json({ error: "未知操作" }, { status: 400 });
  }
  const updated = one("SELECT * FROM pomodoros WHERE id = ?", id);
  const ints = all("SELECT * FROM interruptions WHERE pomodoro_id = ? ORDER BY id DESC", id);
  return NextResponse.json({ session: updated, interruptions: ints });
}
