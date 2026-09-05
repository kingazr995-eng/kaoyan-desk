"use client";
import { useEffect, useState } from "react";
import NotesList from "@/components/NotesList";
import QuickCapture from "@/components/QuickCapture";
import { api } from "@/lib/client";

export default function NotesPage() {
  const [banner, setBanner] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // 快捷指令：/notes?text=xxx 自动记录
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get("text");
    if (t && t.trim()) {
      api("/api/notes", { method: "POST", body: { content: t.trim(), kind: "quick" } })
        .then(() => {
          setBanner("✓ 已记录：" + t.trim().slice(0, 40));
          setRefreshKey((k) => k + 1);
        })
        .catch((e) => setBanner(e.message));
    }
  }, []);

  return (
    <div className="space-y-3 md:mx-auto md:max-w-2xl">
      <h1 className="text-xl font-bold md:text-2xl">紧急记录</h1>
      <p className="muted text-xs">备考中冒出的想法/待办，一句话记下，学习时不打断思路</p>
      {banner && <div className="card" style={{ borderColor: "var(--ok)" }}>{banner}</div>}
      <div className="card">
        <div className="card-title">新增记录</div>
        <QuickCapture onSaved={() => setRefreshKey((k) => k + 1)} />
      </div>
      <NotesList kind="quick" refreshKey={refreshKey} />
    </div>
  );
}
