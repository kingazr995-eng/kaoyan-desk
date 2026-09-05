"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  pomo: { icon: "◷", color: "#d4a843", label: "番茄" },
  wrong: { icon: "✎", color: "#7aa2f7", label: "错题" },
  note: { icon: "▤", color: "#7f849c", label: "记录" },
  fitness: { icon: "✓", color: "#9ece6a", label: "打卡" },
  work: { icon: "▤", color: "#7f849c", label: "文书" },
};

export default function Timeline() {
  const [items, setItems] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const r = await api("/api/timeline");
      setItems(r.items || []);
    } catch { /* 忽略 */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (items.length === 0) return <div className="muted text-sm">今天还没有活动。完成第一个番茄，这里会出现你的时间轴。</div>;

  return (
    <div className="space-y-1.5">
      {items.map((it, i) => {
        const meta = TYPE_META[it.type] || TYPE_META.note;
        return (
          <div key={it.type + "-" + it.id} className="flex items-center gap-2 text-sm">
            <span className="mono muted text-xs" style={{ minWidth: "2.6rem" }}>{String(it.created_at || "").slice(11, 16)}</span>
            <span
              className="flex items-center justify-center rounded-full"
              style={{ width: "1.6rem", height: "1.6rem", color: "#fff", background: meta.color, fontSize: "0.75rem", flexShrink: 0 }}
            >
              {meta.icon}
            </span>
            <span className="tag" style={{ background: "var(--tag-other-bg)", color: meta.color, flexShrink: 0 }}>{meta.label}</span>
            <span className="flex-1 truncate">{it.title}</span>
            {i === 0 && <span className="pulse-dot" style={{ marginRight: 0 }} />}
          </div>
        );
      })}
    </div>
  );
}
