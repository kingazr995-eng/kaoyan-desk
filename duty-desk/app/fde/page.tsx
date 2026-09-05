"use client";
import { useState } from "react";
import QuickCapture from "@/components/QuickCapture";
import NotesList from "@/components/NotesList";

export default function FdePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="space-y-3 md:mx-auto md:max-w-2xl">
      <h1 className="text-xl font-bold md:text-2xl">FDE · 边角时间</h1>
      <div className="card" style={{ borderColor: "var(--border)" }}>
        <div className="text-sm">
          FDE = 碎片深度利用（Fragmented Deep Engagement）。
          <span className="muted"> 低优先级入口，不干扰主流程：备考间隙、排队、休息时才处理。收集想法 → 攒一批 → 一次性消化。</span>
        </div>
      </div>
      <div className="card">
        <div className="card-title">收集一个想法</div>
        <QuickCapture kind="fde" placeholder="值得深挖的话题/问题，先存着…" onSaved={() => setRefreshKey((k) => k + 1)} />
      </div>
      <NotesList kind="fde" refreshKey={refreshKey} />
    </div>
  );
}
