"use client";
import StatsView from "@/components/StatsView";

export default function StatsPage() {
  return (
    <div className="space-y-3 md:mx-auto md:max-w-5xl">
      <h1 className="text-xl font-bold md:text-2xl">周报统计</h1>
      <p className="muted text-xs">数据自动沉淀，无需手动整理 · 近7天</p>
      <StatsView />
    </div>
  );
}
