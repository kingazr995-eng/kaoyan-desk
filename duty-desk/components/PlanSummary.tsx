"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";

export default function PlanSummary() {
  const [month, setMonth] = useState<string | null>(null);
  const [week, setWeek] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api("/api/plans");
      setMonth(r.month?.content || null);
      setWeek(r.week?.content || null);
    } catch { /* 忽略 */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (!month && !week) {
    return (
      <Link href="/plan" className="card block" style={{ borderColor: "rgba(212,168,67,.30)" }}>
        <div className="text-sm font-semibold" style={{ color: "var(--accent)" }}>✦ 还没有计划 —— 去制定月/周目标（AI 可代拆每天三件）→</div>
      </Link>
    );
  }
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <div className="card-title !mb-0">计划</div>
        <Link href="/plan" className="text-xs font-semibold" style={{ color: "var(--accent)" }}>编辑 →</Link>
      </div>
      {month && <div className="text-sm mb-0.5"><span className="muted text-xs">月：</span>{month}</div>}
      {week && <div className="text-sm"><span className="muted text-xs">周：</span>{week}</div>}
    </div>
  );
}
