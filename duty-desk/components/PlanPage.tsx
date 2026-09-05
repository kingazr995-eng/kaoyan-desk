"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";

export default function PlanPage() {
  const [monthGoal, setMonthGoal] = useState("");
  const [weekGoal, setWeekGoal] = useState("");
  const [days, setDays] = useState<any[]>([]);
  const [sideNote, setSideNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [hasProfile, setHasProfile] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([api("/api/plans"), api("/api/config")]);
      if (p.month) setMonthGoal(p.month.content);
      if (p.week) setWeekGoal(p.week.content);
      setHasProfile(!!(c.profile && Object.keys(c.profile).length));
    } catch { /* 忽略 */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setBusy(true);
    setMsg("");
    try {
      const r = await api("/api/plan/ai", { method: "POST", body: { sideNote } });
      const plan = r.plan;
      if (plan.monthGoal) setMonthGoal(plan.monthGoal);
      if (plan.weekGoal) setWeekGoal(plan.weekGoal);
      if (Array.isArray(plan.days) && plan.days.length) setDays(plan.days);
      setMsg("✓ 已生成草稿，每个字都可改");
    } catch (e: any) { setMsg(e.message); }
    setBusy(false);
  };

  const setDayTask = (di: number, ti: number, v: string) => {
    setDays((prev) => prev.map((d, i) =>
      i === di ? { ...d, tasks: (d.tasks || []).map((t: string, j: number) => (j === ti ? v : t)) } : d
    ));
  };

  const saveGoals = async () => {
    try {
      if (monthGoal.trim()) await api("/api/plans", { method: "POST", body: { period: "month", content: monthGoal.trim() } });
      if (weekGoal.trim()) await api("/api/plans", { method: "POST", body: { period: "week", content: weekGoal.trim() } });
      setMsg("✓ 月/周目标已保存");
      setTimeout(() => setMsg(""), 2000);
    } catch (e: any) { setMsg(e.message); }
  };

  const fillCards = async () => {
    if (!days.length) { setMsg("先点「AI 生成」得到每日三件"); return; }
    try {
      for (const d of days) {
        const t = d.tasks || [];
        await api("/api/daily", {
          method: "POST",
          body: { date: d.date, task1: t[0] || "", task2: t[1] || "", task3: t[2] || "", done1: 0, done2: 0, done3: 0 },
        });
      }
      setMsg("✓ 已填入本周每日卡，回看板就能看到了");
      setTimeout(() => setMsg(""), 2500);
    } catch (e: any) { setMsg(e.message); }
  };

  return (
    <div className="space-y-3">
      {!hasProfile && (
        <div className="card" style={{ borderColor: "rgba(212,168,67,.35)" }}>
          <div className="text-sm">建议先到 <Link href="/settings" style={{ color: "var(--accent)" }}>设置 → 备考档案</Link> 填一下你的背景，AI 计划会更贴合。没填也能生成保守版。</div>
        </div>
      )}

      <div className="card">
        <div className="card-title">月目标 / 本周目标</div>
        <input className="input" placeholder="月目标：如 数学过完高数 + 电路到正弦稳态" value={monthGoal} onChange={(e) => setMonthGoal(e.target.value)} />
        <input className="input mt-2" placeholder="本周目标：如 高数第1-2章 + 背词350 + 电路KCL" value={weekGoal} onChange={(e) => setWeekGoal(e.target.value)} />
        <div className="flex gap-2 mt-2">
          <button className="btn btn-sm" onClick={saveGoals}>保存目标</button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">AI 生成未来 7 天三件</div>
        <input className="input" placeholder="本周侧重（可选）：如 数学为主、电路跟进度" value={sideNote} onChange={(e) => setSideNote(e.target.value)} />
        <button className="btn w-full mt-2" onClick={generate} disabled={busy}>
          {busy ? "AI 生成中（约30-60秒）…" : "AI 生成计划"}
        </button>
        {days.length > 0 && (
          <button className="btn btn-ghost-accent w-full mt-2" onClick={fillCards}>确认，一键填入本周每日卡</button>
        )}
        {msg && <div className="text-xs mt-2" style={{ color: "var(--accent)" }}>{msg}</div>}
      </div>

      {days.length > 0 && (
        <div className="space-y-2">
          {days.map((d, di) => (
            <div key={d.date} className="card !py-2.5">
              <div className="mono muted text-xs mb-1.5">{d.date}（{["日", "一", "二", "三", "四", "五", "六"][new Date(d.date + "T00:00:00").getDay()]}）</div>
              {[0, 1, 2].map((ti) => (
                <input
                  key={ti}
                  className="input !py-1.5 mt-1"
                  value={(d.tasks || [])[ti] || ""}
                  placeholder={`第 ${ti + 1} 件`}
                  onChange={(e) => setDayTask(di, ti, e.target.value)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
