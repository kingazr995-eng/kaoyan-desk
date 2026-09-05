"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";

export const DEFAULT_EXAM = "2026-12-19";

export default function Countdown() {
  const [examDate, setExamDate] = useState(DEFAULT_EXAM);
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      let d = DEFAULT_EXAM;
      try {
        const c = await api("/api/config");
        if (c.examDate) d = c.examDate;
      } catch { /* 默认日期兜底 */ }
      if (!mounted) return;
      setExamDate(d);
      const target = new Date(d + "T00:00:00");
      setDays(Math.max(0, Math.ceil((target.getTime() - Date.now()) / 86400000)));
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="card flex items-center justify-between !py-3" style={{ borderColor: "rgba(212,168,67,.30)" }}>
      <div>
        <div className="muted text-[0.68rem] uppercase tracking-widest">2027 考研初试倒计时</div>
        <div className="mono text-sm mt-1">{examDate}</div>
      </div>
      <div className="text-right">
        <div className="mono text-4xl font-bold" style={{ color: "var(--accent)", letterSpacing: "-0.03em" }}>
          {days === null ? "—" : days}
        </div>
        <div className="muted text-[0.68rem] uppercase tracking-widest mt-0.5">天</div>
      </div>
    </div>
  );
}
