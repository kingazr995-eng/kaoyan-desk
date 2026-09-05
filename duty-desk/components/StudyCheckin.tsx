"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { SUBJECTS, SUBJECT_TAG } from "@/lib/subjects";

export default function StudyCheckin() {
  const [today, setToday] = useState<any>(null);
  const [week, setWeek] = useState<any[]>([]);
  const [signedDays, setSignedDays] = useState(0);
  const [input, setInput] = useState("");
  const [subject, setSubject] = useState("other");
  const [showWeek, setShowWeek] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await api("/api/study");
      setToday(r.today);
      setWeek(r.week || []);
      setSignedDays(r.signedDays || 0);
      if (r.today) { setInput(r.today.content); setSubject(r.today.subject || "other"); }
    } catch { /* 忽略 */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!input.trim()) return;
    try {
      await api("/api/study", { method: "POST", body: { content: input.trim(), subject } });
      setMsg("✓ 已签到");
      setTimeout(() => setMsg(""), 1800);
      load();
    } catch (e: any) { setMsg(e.message); }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <div className="card-title !mb-0">学习签到 · 今天学了什么</div>
        <span className="mono text-sm font-bold" style={{ color: "var(--accent)" }}>本周 {signedDays}/7</span>
      </div>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="如：高数极限 + 电路KCL，刷题10道"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
        <select className="input !w-auto" value={subject} onChange={(e) => setSubject(e.target.value)}>
          {SUBJECTS.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
        </select>
        <button className="btn" onClick={save}>{today ? "更新" : "签到"}</button>
      </div>
      {msg && <div className="text-xs mt-1" style={{ color: "var(--accent)" }}>{msg}</div>}

      <button className="text-xs font-semibold mt-2" style={{ color: "var(--accent)" }} onClick={() => setShowWeek(!showWeek)}>
        {showWeek ? "收起本周 ▲" : "看这周学了什么 ▽"}
      </button>
      {showWeek && (
        <div className="mt-1.5 space-y-1">
          {week.map((w) => (
            <div key={w.date} className="flex gap-2 text-sm" style={w.isToday ? { color: "var(--accent)" } : {}}>
              <span className="mono muted text-xs" style={{ minWidth: "2.5rem" }}>{w.date.slice(5)}</span>
              <span className="muted text-xs" style={{ minWidth: "1rem" }}>{w.weekday}</span>
              <span className={"flex-1 break-words " + (!w.content ? "muted" : "")}>
                {w.subject && w.subject !== "other" && <span className={`tag ${SUBJECT_TAG[w.subject] || "tag-other"}`}>{w.subject}</span>}{" "}
                {w.content || "未记录"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
