import { NextRequest, NextResponse } from "next/server";
import { run, todayStr } from "@/lib/db";

export const dynamic = "force-dynamic";

// 合并离线操作（手机端待同步队列）
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const ops = Array.isArray(body.ops) ? body.ops : [];
  let applied = 0;
  for (const op of ops) {
    try {
      const path = String(op.path || "");
      const p = op.payload || {};
      if (path.startsWith("/api/daily")) {
        run(
          `INSERT INTO daily_cards (date, task1, task2, task3, done1, done2, done3, note)
           VALUES (?,?,?,?,?,?,?,?)
           ON CONFLICT(date) DO UPDATE SET task1=excluded.task1, task2=excluded.task2, task3=excluded.task3,
             done1=excluded.done1, done2=excluded.done2, done3=excluded.done3, note=excluded.note`,
          String(p.date || todayStr()), String(p.task1 ?? ""), String(p.task2 ?? ""), String(p.task3 ?? ""),
          p.done1 ? 1 : 0, p.done2 ? 1 : 0, p.done3 ? 1 : 0, String(p.note ?? "")
        );
      } else if (path.startsWith("/api/study")) {
        run(
          `INSERT INTO study_logs (date, content, subject) VALUES (?,?,?)
           ON CONFLICT(date) DO UPDATE SET content=excluded.content, subject=excluded.subject`,
          String(p.date || todayStr()), String(p.content || ""), String(p.subject || "other")
        );
      } else if (path.startsWith("/api/tasks")) {
        run(
          "INSERT INTO tasks (title, subject, planned_min, task_date) VALUES (?,?,?,?)",
          String(p.title || ""), String(p.subject || "other"), Number(p.plannedMin) || 25, String(p.date || todayStr())
        );
      } else if (path.startsWith("/api/notes")) {
        run("INSERT INTO notes (content, kind) VALUES (?,?)", String(p.content || ""), p.kind === "fde" ? "fde" : "quick");
      } else {
        continue;
      }
      applied++;
    } catch { /* 单条失败跳过 */ }
  }
  return NextResponse.json({ ok: true, applied });
}
