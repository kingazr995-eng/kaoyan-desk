"use client";
import { useCallback, useEffect, useState } from "react";
import { api, fmtMin } from "@/lib/client";
import { SUBJECT_NAME } from "@/lib/subjects";
import Donut from "@/components/Donut";

const SUBJ_ORDER = ["math", "eng", "pol", "elec", "fitness", "other"];
const SUBJ_COLOR: Record<string, string> = {
  math: "#7aa2f7", eng: "#9ece6a", pol: "#f7768e", elec: "#e0af68",
  fitness: "#e5c07b", other: "#565f89",
};

export default function StatsView() {
  const [stats, setStats] = useState<any>(null);
  const [plans, setPlans] = useState<any>({});
  const [err, setErr] = useState("");
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api("/api/stats?days=7");
      setStats(r);
    } catch (e: any) { setErr(e.message); }
    try {
      const p = await api("/api/plans");
      setPlans(p || {});
    } catch { /* 忽略 */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!stats) {
    return <div className="muted text-sm text-center py-10">{err || "加载中…"}</div>;
  }

  const totalMin = (stats.focus || []).reduce((a: number, x: any) => a + Number(x.minutes || 0), 0);
  const todayMin = (stats.todayFocus || []).reduce((a: number, x: any) => a + Number(x.minutes || 0), 0);
  const prevMap = new Map((stats.prevFocus || []).map((x: any) => [x.subject, Number(x.minutes || 0)]));
  const sorted = [...(stats.focus || [])].sort(
    (a, b) => SUBJ_ORDER.indexOf(a.subject) - SUBJ_ORDER.indexOf(b.subject)
  );
  const segments = sorted.map((x: any) => ({
    value: Number(x.minutes || 0),
    color: SUBJ_COLOR[x.subject] || "#565f89",
  }));

  const STAT_CARDS = [
    { label: "近7天专注", value: fmtMin(totalMin), bg: "linear-gradient(135deg, rgba(212,168,67,.14), rgba(212,168,67,.02))", border: "rgba(212,168,67,.30)" },
    { label: "番茄数", value: String(stats.pomoCount), bg: "linear-gradient(135deg, rgba(212,168,67,.09), rgba(212,168,67,.02))", border: "rgba(212,168,67,.20)" },
    { label: "连续学习", value: (stats.studyStreak ?? 0) + "天", bg: "linear-gradient(135deg, rgba(158,206,106,.09), rgba(158,206,106,.02))", border: "rgba(158,206,106,.20)" },
    { label: "连续打卡", value: (stats.streak ?? 0) + "天", bg: "linear-gradient(135deg, rgba(158,206,106,.09), rgba(158,206,106,.02))", border: "rgba(158,206,106,.20)" },
  ];

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        {STAT_CARDS.map((c) => (
          <div key={c.label} className="card !py-2.5 text-center md:!py-4" style={{ background: c.bg, borderColor: c.border }}>
            <div className="text-lg font-extrabold mono md:text-2xl" style={{ color: "var(--text)" }}>{c.value}</div>
            <div className="muted text-[0.65rem] mt-0.5 md:text-xs">{c.label}</div>
          </div>
        ))}
      </div>

      {/* 本周进度 */}
      <div className="card">
        <div className="card-title">本周进度</div>
        {plans?.week?.content && <div className="text-sm mb-2">目标：{plans.week.content}</div>}
        <div className="flex items-center gap-2 text-sm mb-1">
          <span style={{ minWidth: "4rem" }}>三件完成</span>
          <div className="stat-bar flex-1"><div style={{ width: (stats.weekTotal ? Math.round((stats.weekDone / stats.weekTotal) * 100) : 0) + "%" }} /></div>
          <span className="mono text-xs">{stats.weekDone}/{stats.weekTotal}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span style={{ minWidth: "4rem" }}>签到</span>
          <div className="stat-bar flex-1"><div style={{ width: Math.round((stats.signedDays / 7) * 100) + "%" }} /></div>
          <span className="mono text-xs">{stats.signedDays}/7 天</span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        <div className="space-y-3 md:space-y-4">
          <div className="card">
            <div className="card-title">时间投入分布（近7天 · {fmtMin(totalMin)}）</div>
            <div className="flex items-center gap-4">
              <Donut
                segments={segments}
                centerLabel={totalMin >= 60 ? Math.round(totalMin / 60) + "h" : String(totalMin)}
                centerSub="总时长"
              />
              <div className="flex-1 space-y-1.5 min-w-0">
                {sorted.length === 0 && <div className="muted text-sm">暂无数据，完成几个番茄后这里会有分布图</div>}
                {sorted.map((x: any) => {
                  const m = Number(x.minutes || 0);
                  const prev = prevMap.get(x.subject);
                  const deltaMin = prev !== undefined ? m - Number(prev) : null;
                  return (
                    <div key={x.subject} className="flex items-center gap-2 text-sm">
                      <span className="rounded-full" style={{ width: "0.6rem", height: "0.6rem", background: SUBJ_COLOR[x.subject] || "#565f89", flexShrink: 0 }} />
                      <span className="font-semibold flex-1 truncate">{SUBJECT_NAME[x.subject] || x.subject}</span>
                      <span className="muted mono text-xs">
                        {fmtMin(m)} · {Math.round((m / Math.max(1, totalMin)) * 100)}%
                        {deltaMin !== null && (deltaMin === 0
                          ? <span className="muted"> · 持平</span>
                          : <span style={{ color: deltaMin > 0 ? "var(--danger)" : "var(--ok)" }}> · {deltaMin > 0 ? "↑" : "↓"}{Math.abs(deltaMin)}分</span>)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="muted text-xs mt-2">今日已投入 {fmtMin(todayMin)} · 记录 {stats.notesCount} 条 · 打卡 {stats.fitnessCount} 次</div>
          </div>
        </div>

        <div className="space-y-3 md:space-y-4">
          <div className="card">
            <button className="flex w-full items-center justify-between" onClick={() => setExpanded(!expanded)}>
              <div className="card-title !mb-0">最近完成的番茄</div>
              <span className="muted text-xs">{expanded ? "收起 ▲" : "展开 ▼"}</span>
            </button>
            {expanded && (
              <div className="mt-2 space-y-1 text-sm">
                {(stats.sessions || []).slice(0, 20).map((s: any) => (
                  <div key={s.id} className="flex gap-2 items-center">
                    <span className="muted mono text-xs">{String(s.created_at || "").slice(5, 16)}</span>
                    <span className="flex-1 truncate">{s.task_title}</span>
                    <span className="muted mono text-xs">{s.length_min}′</span>
                  </div>
                ))}
                {(stats.sessions || []).length === 0 && <div className="muted text-sm">还没有完成的番茄</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
