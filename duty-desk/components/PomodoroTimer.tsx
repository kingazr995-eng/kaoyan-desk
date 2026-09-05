"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, fmtTime, mmss } from "@/lib/client";
import { SUBJECT_TAG, QUICK_TASKS } from "@/lib/subjects";

export default function PomodoroTimer() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selTaskId, setSelTaskId] = useState<number | null>(null);
  const [selTitle, setSelTitle] = useState("自由专注");
  const [selSubject, setSelSubject] = useState("other");
  const [lengthMin, setLengthMin] = useState(25);
  const [session, setSession] = useState<any | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [intType, setIntType] = useState("work");
  const [intNote, setIntNote] = useState("");
  const [showInt, setShowInt] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastNote, setLastNote] = useState<string>("");
  const endAtRef = useRef(0);
  const actionRef = useRef<() => void>(() => {});
  const autoParamsRef = useRef<{ len: number; task: string } | null>(null);
  const autoStartedRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const [t, s, a] = await Promise.all([
        api("/api/tasks"),
        api("/api/pomodoros"),
        api("/api/pomodoros?active=1"),
      ]);
      setTasks((t.tasks || []).filter((x: any) => x.status === "todo"));
      setSessions(s.sessions || []);
      const act = a.session;
      if (act) {
        setSession(act);
        setRemaining(act.remaining_sec);
        setRunning(act.status === "running");
        endAtRef.current = Date.now() + act.remaining_sec * 1000;
        setLastNote(act.notes || "");
        setShowInt(false);
      }
    } catch (e: any) {
      setMsg(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("auto") === "1") {
        autoParamsRef.current = {
          len: Math.min(120, Math.max(1, Number(p.get("len")) || 25)),
          task: p.get("task") || "",
        };
      }
    }
    load();
  }, [load]);

  const done = useCallback(async () => {
    if (!session) return;
    try {
      await api(`/api/pomodoros/${session.id}`, { method: "POST", body: { action: "done" } });
      setMsg("✓ 番茄完成，已计入时间日志");
      setSession(null);
      setRunning(false);
      load();
    } catch (e: any) { setMsg(e.message); }
  }, [session, load]);
  actionRef.current = done;

  // 计时器
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      const r = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
      setRemaining(r);
      if (r <= 0) {
        clearInterval(iv);
        setRunning(false);
        actionRef.current();
      }
    }, 500);
    return () => clearInterval(iv);
  }, [running]);

  const start = async (o?: { title?: string; subject?: string; length?: number; taskId?: number | null }) => {
    try {
      const r = await api("/api/pomodoros", {
        method: "POST",
        body: {
          task_id: o?.taskId !== undefined ? o.taskId : selTaskId,
          task_title: o?.title ?? selTitle,
          subject: o?.subject ?? selSubject,
          length_min: o?.length ?? lengthMin,
        },
      });
      setSession(r.session);
      setRemaining(r.session.remaining_sec);
      setRunning(true);
      setMsg("");
      endAtRef.current = Date.now() + r.session.remaining_sec * 1000;
    } catch (e: any) { setMsg(e.message); }
  };

  const act = async (action: string, extra: any = {}) => {
    if (!session) return;
    try {
      const r = await api(`/api/pomodoros/${session.id}`, { method: "POST", body: { action, ...extra } });
      if (action === "pause" || action === "interrupt") {
        setSession(r.session);
        setRemaining(r.session.remaining_sec);
        setRunning(false);
        if (action === "interrupt") {
          setMsg("已记录打断，任务已暂停，可随时继续");
          setLastNote(r.interruptions?.[0]?.note || "");
          setShowInt(false);
          setIntNote("");
        }
      } else if (action === "resume") {
        setSession(r.session);
        setRemaining(r.session.remaining_sec);
        setRunning(true);
        endAtRef.current = Date.now() + r.session.remaining_sec * 1000;
        setMsg("");
      } else if (action === "skip") {
        setMsg("已跳过（不计入时间）");
        setSession(null);
        setRunning(false);
      }
      load();
    } catch (e: any) { setMsg(e.message); }
  };

  const addQuickTask = async (q: any) => {
    try {
      const r = await api("/api/tasks", { method: "POST", body: q });
      setTasks((prev) => [r.task, ...prev]);
      setSelTaskId(r.task.id);
      setSelTitle(r.task.title);
      setSelSubject(r.task.subject);
      setMsg(`已加入今日任务：${q.title}`);
    } catch (e: any) { setMsg(e.message); }
  };

  const onTaskSelect = (idStr: string) => {
    if (!idStr) {
      setSelTaskId(null); setSelTitle("自由专注"); setSelSubject("other");
      return;
    }
    const t = tasks.find((x) => String(x.id) === idStr);
    if (t) { setSelTaskId(t.id); setSelTitle(t.title); setSelSubject(t.subject); }
  };

  // 快捷指令：?auto=1 打开即自动开始
  useEffect(() => {
    if (loading || autoStartedRef.current) return;
    const ap = autoParamsRef.current;
    if (ap && !session) {
      autoStartedRef.current = true;
      start({ title: ap.task || "自由专注", length: ap.len });
    }
  }, [loading, session]);

  const activeTitle = session ? session.task_title : selTitle;
  const activeSubject = session ? session.subject : selSubject;
  const totalSec = (session ? session.length_min : lengthMin) * 60;
  const pct = totalSec > 0 ? Math.round(((totalSec - remaining) / totalSec) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* 恢复卡：上次被打断的任务 */}
      {session && !running && (
        <div className="card" style={{ borderColor: "var(--accent)" }}>
          <div className="text-xs font-bold" style={{ color: "var(--accent)" }}>⏸ 上次任务（已暂停）</div>
          <div className="mt-1 text-base font-semibold">{session.task_title}</div>
          <div className="muted mono text-sm">剩余 {mmss(remaining)}</div>
          {lastNote && <div className="muted text-xs mt-1">思路备注：{lastNote}</div>}
          <div className="mt-2 flex gap-2">
            <button className="btn btn-sm" onClick={() => act("resume")}>▶ 继续</button>
            <button className="btn btn-sm btn-ghost" onClick={() => act("skip")}>放弃</button>
          </div>
        </div>
      )}

      {/* 主计时卡片 */}
      <div className="card text-center">
        <div className="text-sm font-semibold">
          <span className={`tag ${SUBJECT_TAG[activeSubject] || "tag-other"}`}>{activeTitle}</span>
        </div>
        <div className={"timer-digit " + (running ? "" : "muted")} style={{ margin: "0.75rem 0 0.25rem" }}>
          {mmss(remaining)}
        </div>
        <div className="muted text-xs mb-1">
          {running ? <span><span className="pulse-dot" />专注中 · {lengthMin}分钟 · 进度 {pct}%</span>
            : session ? "已暂停" : "空闲 · 选好任务即可开始"}
        </div>
        <div className="stat-bar" style={{ marginBottom: "0.9rem" }}>
          <div style={{ width: `${pct}%`, transition: "width 0.5s" }} />
        </div>

        {/* 任务选择 + 时长（仅空闲时可选） */}
        {!session && (
          <div className="text-left">
            <label className="label">当前任务</label>
            <select className="input" value={selTaskId ?? ""} onChange={(e) => onTaskSelect(e.target.value)}>
              <option value="">自由专注</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            <div className="flex gap-2 mt-2">
              {[25, 50].map((m) => (
                <button key={m} className={"btn btn-sm " + (lengthMin === m ? "" : "btn-ghost")}
                  onClick={() => setLengthMin(m)}>{m}分钟</button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {!session && <button className="btn btn-lg" onClick={() => start()}>▶ 开始</button>}
          {session && !running && <button className="btn" onClick={() => act("resume")}>▶ 继续</button>}
          {session && running && (
            <>
              <button className="btn" onClick={() => act("pause")}>⏸ 暂停</button>
              <button className="btn btn-ghost" onClick={() => { setShowInt(!showInt); }}>✋ 打断</button>
            </>
          )}
          {session && <button className="btn btn-ghost" onClick={() => act("done")}>✓ 完成</button>}
          {session && <button className="btn btn-ghost" onClick={() => act("skip")}>跳过</button>}
        </div>

        {msg && <div className="mt-2 text-sm" style={{ color: "var(--accent)" }}>{msg}</div>}

        {/* 打断面板 */}
        {showInt && session && (
          <div className="mt-3 text-left" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
            <div className="text-xs font-bold muted mb-1">记录打断（任务自动暂停，回来继续）</div>
            <div className="flex gap-2">
              {[["work", "琐事/家务"], ["health", "身体不适"], ["other", "其他"]].map(([k, label]) => (
                <button key={k} className={"btn btn-sm " + (intType === k ? "" : "btn-ghost")} onClick={() => setIntType(k)}>{label}</button>
              ))}
            </div>
            <input className="input mt-2" placeholder="一句话记录当前思路（可选）" value={intNote}
              onChange={(e) => setIntNote(e.target.value)} />
            <button className="btn btn-sm mt-2" onClick={() => act("interrupt", { type: intType, note: intNote })}>记录并暂停</button>
          </div>
        )}
      </div>

      {/* 原子化任务快捷添加 */}
      <div className="card">
        <div className="card-title">一键加入今日任务</div>
        <div className="flex flex-wrap gap-2">
          {QUICK_TASKS.map((q) => (
            <button key={q.title} className="btn btn-sm btn-ghost" onClick={() => addQuickTask(q)}>
              + {q.title}
            </button>
          ))}
        </div>
      </div>

      {/* 今日完成记录 */}
      <div className="card">
        <div className="card-title">今日时间日志（自动记录）</div>
        {sessions.filter((s: any) => s.status === "done" || s.status === "skipped").length === 0 && (
          <div className="muted text-sm">今天还没有完成的番茄</div>
        )}
        <div className="space-y-1.5">
          {sessions.filter((s: any) => s.status === "done" || s.status === "skipped").map((s: any) => (
            <div key={s.id} className="flex items-center gap-2 text-sm">
              <span className={`tag ${SUBJECT_TAG[s.subject] || "tag-other"}`}>{s.subject === "other" ? "自由" : s.subject}</span>
              <span className="flex-1 truncate">{s.task_title}</span>
              <span className="muted mono text-xs">{s.length_min}′ {fmtTime(s.started_at)}–{fmtTime(s.ended_at)}</span>
            </div>
          ))}
        </div>
      </div>

      {loading && <div className="muted text-center text-sm">加载中…</div>}
    </div>
  );
}
