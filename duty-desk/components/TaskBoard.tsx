"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { SUBJECT_NAME, SUBJECT_TAG, QUICK_TASKS } from "@/lib/subjects";

export default function TaskBoard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("math");
  const [plannedMin, setPlannedMin] = useState("25");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await api("/api/tasks");
      setTasks(r.tasks || []);
    } catch (e: any) { setMsg(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async (t?: string, subj?: string, pm?: string) => {
    const body = { title: t ?? title, subject: subj ?? subject, plannedMin: Number(pm ?? plannedMin) || 25 };
    if (!body.title.trim()) return;
    try {
      const r = await api("/api/tasks", { method: "POST", body });
      setTasks((prev) => [r.task, ...prev]);
      setTitle("");
      setMsg("");
    } catch (e: any) { setMsg(e.message); }
  };

  const toggle = async (task: any) => {
    const next = task.status === "todo" ? "done" : "todo";
    try {
      const r = await api(`/api/tasks/${task.id}`, { method: "PATCH", body: { status: next } });
      setTasks((prev) => prev.map((x) => (x.id === task.id ? r.task : x)));
    } catch (e: any) { setMsg(e.message); }
  };

  const remove = async (id: number) => {
    try { await api(`/api/tasks/${id}`, { method: "DELETE" }); setTasks((prev) => prev.filter((x) => x.id !== id)); }
    catch (e: any) { setMsg(e.message); }
  };

  const done = tasks.filter((t) => t.status === "done").length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input className="input flex-1" placeholder="原子化任务，如：完成3道极限题" value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()} />
        <button className="btn" onClick={() => add()}>添加</button>
      </div>
      <div className="flex gap-2 items-center">
        <select className="input !w-auto" value={subject} onChange={(e) => setSubject(e.target.value)}>
          {Object.entries(SUBJECT_NAME).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input !w-auto" value={plannedMin} onChange={(e) => setPlannedMin(e.target.value)}>
          {["10", "15", "20", "25", "30", "50"].map((m) => <option key={m} value={m}>{m}分钟</option>)}
        </select>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_TASKS.map((q) => (
          <button key={q.title} className="btn btn-sm btn-ghost" onClick={() => add(q.title, q.subject, String(q.plannedMin))}>
            + {q.title}
          </button>
        ))}
      </div>

      {tasks.length > 0 && (
        <div className="flex items-center gap-2 text-xs muted">
          <div className="stat-bar flex-1"><div style={{ width: `${pct}%` }} /></div>
          <span className="mono">{done}/{tasks.length}</span>
        </div>
      )}

      <div className="space-y-1.5">
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center gap-2" style={{ opacity: t.status === "done" ? 0.55 : 1 }}>
            <button
              className="btn btn-sm btn-ghost !px-2"
              style={{ minWidth: "2rem" }}
              onClick={() => toggle(t)}
            >
              {t.status === "done" ? "✓" : "○"}
            </button>
            <span className={`tag ${SUBJECT_TAG[t.subject] || "tag-other"}`}>{SUBJECT_NAME[t.subject] || t.subject}</span>
            <span className={"flex-1 text-sm " + (t.status === "done" ? "line-through" : "")}>{t.title}</span>
            <span className="muted mono text-xs">{t.planned_min}′</span>
            <button className="muted text-sm px-1" onClick={() => remove(t.id)}>×</button>
          </div>
        ))}
      </div>
      {loading && <div className="muted text-sm text-center">加载中…</div>}
      {msg && <div className="text-sm" style={{ color: "var(--danger)" }}>{msg}</div>}
    </div>
  );
}
