"use client";
import PlanPage from "@/components/PlanPage";

export default function PlanRoute() {
  return (
    <div className="space-y-3 md:mx-auto md:max-w-2xl">
      <h1 className="text-xl font-bold md:text-2xl">计划</h1>
      <p className="muted text-xs">月目标 → 周目标 → AI 拆成每天三件 → 一键填卡</p>
      <PlanPage />
    </div>
  );
}
