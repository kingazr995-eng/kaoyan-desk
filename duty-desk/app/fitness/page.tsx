"use client";
import FitnessCheck from "@/components/FitnessCheck";

export default function FitnessPage() {
  return (
    <div className="space-y-3 md:mx-auto md:max-w-2xl">
      <h1 className="text-xl font-bold md:text-2xl">健身打卡</h1>
      <p className="muted text-xs">健身只执行不研究：固定计划导入，打卡即走</p>
      <FitnessCheck />
    </div>
  );
}
