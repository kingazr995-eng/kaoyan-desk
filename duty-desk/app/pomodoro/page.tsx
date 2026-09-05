"use client";
import PomodoroTimer from "@/components/PomodoroTimer";

export default function PomodoroPage() {
  return (
    <div className="space-y-3 md:mx-auto md:max-w-2xl">
      <h1 className="text-xl font-bold md:text-2xl">番茄钟</h1>
      <p className="muted text-xs">任务原子化（15-30分钟）· 随时暂停 · 打断自动恢复</p>
      <PomodoroTimer />
    </div>
  );
}
