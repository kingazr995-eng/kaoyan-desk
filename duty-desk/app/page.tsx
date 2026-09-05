"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, fmtMin, mmss } from "@/lib/client";
import TaskBoard from "@/components/TaskBoard";
import QuickCapture from "@/components/QuickCapture";
import GoalsCard from "@/components/GoalsCard";
import Timeline from "@/components/Timeline";
import Countdown from "@/components/Countdown";
import DailyCard from "@/components/DailyCard";
import StudyCheckin from "@/components/StudyCheckin";
import PlanSummary from "@/components/PlanSummary";
import SyncBar from "@/components/SyncBar";

const CARD_THEME: Record<string, { bg: string; border: string }> = {
  focus: { bg: "linear-gradient(135deg, rgba(212,168,67,.14), rgba(212,168,67,.02))", border: "rgba(212,168,67,.30)" },
  pomo: { bg: "linear-gradient(135deg, rgba(212,168,67,.09), rgba(212,168,67,.02))", border: "rgba(212,168,67,.20)" },
  task: { bg: "linear-gradient(135deg, rgba(122,162,247,.09), rgba(122,162,247,.02))", border: "rgba(122,162,247,.20)" },
  streak: { bg: "linear-gradient(135deg, rgba(158,206,106,.09), rgba(158,206,106,.02))", border: "rgba(158,206,106,.20)" },
};

export default function Dashboard() {
  const [todayMin, setTodayMin] = useState<number | null>(null);
  const [todayPomo, setTodayPomo] = useState(0);
  const [streak, setStreak] = useState(0);
  const [taskDone, setTaskDone] = useState(0);
  const [taskTotal, setTaskTotal] = useState(0);
  const [active, setActive] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, a, t] = await Promise.all([
          api("/api/stats?days=1"),
          api("/api/pomodoros?active=1"),
          api("/api/tasks"),
        ]);
        setTodayMin((s.todayFocus || []).reduce((sum: number, x: any) => sum + Number(x.minutes || 0), 0));
        setTodayPomo(s.pomoCount || 0);
        setStreak(s.streak || 0);
        setActive(a.session);
        const ts = (t.tasks || []);
        setTaskDone(ts.filter((x: any) => x.status === "done").length);
        setTaskTotal(ts.length);
      } catch { /* 忽略 */ }
    })();
  }, []);

  const dateStr = new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" });

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold md:text-2xl">考研工作台</h1>
          <div className="muted text-xs mt-0.5">{dateStr}</div>
        </div>
        <div className="flex gap-1.5 md:hidden">
          <Link href="/chat" className="btn btn-sm btn-ghost">AI助手</Link>
          <Link href="/settings" className="btn btn-sm btn-ghost">设置</Link>
        </div>
      </div>

      <SyncBar />

      <Countdown />

      <PlanSummary />

      <DailyCard />

      <StudyCheckin />

      {active && active.status !== "running" && (
        <Link href="/pomodoro" className="card block" style={{ borderColor: "var(--accent)" }}>
          <div className="text-xs font-bold" style={{ color: "var(--accent)" }}>⏸ 有未完成任务（上次被中断）</div>
          <div className="text-base font-semibold mt-0.5">{active.task_title}</div>
          <div className="muted mono text-sm">剩余 {mmss(active.remaining_sec)}{active.notes ? " · 备注：" + active.notes : ""}</div>
          <div className="text-xs mt-1" style={{ color: "var(--accent)" }}>点击去继续 →</div>
        </Link>
      )}

      {/* 统计卡（全宽） */}
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        {[
          { key: "focus", label: "今日专注", value: todayMin !== null ? fmtMin(todayMin).replace("分钟", "m") : "—", sub: "分钟" },
          { key: "pomo", label: "番茄", value: String(todayPomo), sub: "个" },
          { key: "task", label: "任务", value: `${taskDone}/${taskTotal}`, sub: "完成" },
          { key: "streak", label: "连续打卡", value: String(streak), sub: "天" },
        ].map((c) => {
          const t = CARD_THEME[c.key];
          return (
            <div key={c.key} className="card !py-2.5 text-center md:!py-4" style={{ background: t.bg, borderColor: t.border }}>
              <div className="text-xl font-extrabold mono md:text-2xl" style={{ color: "var(--text)" }}>{c.value}</div>
              <div className="muted text-[0.65rem] mt-0.5 md:text-xs">{c.label} · {c.sub}</div>
            </div>
          );
        })}
      </div>

      {/* 桌面双栏：左=学习主区，右=辅助区 */}
      <div className="grid gap-3 md:grid-cols-3 md:gap-4">
        <div className="space-y-3 md:col-span-2 md:space-y-4">
          <div className="card">
            <div className="card-title">今日任务</div>
            <TaskBoard />
          </div>
          <div className="card">
            <div className="card-title">今日动态</div>
            <Timeline />
          </div>
        </div>

        <div className="space-y-3 md:space-y-4">
          <div className="card">
            <GoalsCard />
          </div>

          <div className="grid grid-cols-4 gap-2 md:grid-cols-2 md:gap-2">
            <Link href="/pomodoro" className="card text-center !py-3">
              <div className="text-xl">◷</div><div className="text-xs mt-1 font-semibold">开始番茄</div>
            </Link>
            <Link href="/fitness" className="card text-center !py-3">
              <div className="text-xl">✓</div><div className="text-xs mt-1 font-semibold">健身打卡</div>
            </Link>
            <Link href="/fde" className="card text-center !py-3">
              <div className="text-xl">▦</div><div className="text-xs mt-1 font-semibold">FDE</div>
            </Link>
            <Link href="/stats" className="card text-center !py-3">
              <div className="text-xl">▥</div><div className="text-xs mt-1 font-semibold">周报</div>
            </Link>
          </div>

          <div className="card">
            <div className="card-title">紧急记录</div>
            <QuickCapture linkHref="/notes" linkLabel="全部记录 →" />
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
            <Link href="/notes" className="card text-center !py-3 md:flex md:items-center md:gap-2 md:text-left">
              <div className="text-base font-semibold">▤ 记录</div>
              <div className="muted text-xs mt-0.5 md:mt-0 md:text-sm">想法/待办</div>
            </Link>
            <Link href="/chat" className="card text-center !py-3 md:flex md:items-center md:gap-2 md:text-left">
              <div className="text-base font-semibold">✦ AI助手</div>
              <div className="muted text-xs mt-0.5 md:mt-0 md:text-sm">通用问答</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
