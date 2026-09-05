"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";

export default function NotesList({ kind = "quick", refreshKey = 0 }: { kind?: "quick" | "fde"; refreshKey?: number }) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await api(`/api/notes?kind=${kind}`);
      setNotes(r.notes || []);
    } catch { /* 忽略 */ }
    setLoading(false);
  }, [kind, refreshKey]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: number) => {
    try {
      await api(`/api/notes/${id}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch { /* 忽略 */ }
  };

  const groups: Record<string, any[]> = {};
  for (const n of notes) {
    const d = (n.created_at || "").slice(0, 10);
    (groups[d] = groups[d] || []).push(n);
  }

  return (
    <div className="space-y-3">
      {Object.entries(groups).map(([date, list]) => (
        <div key={date}>
          <div className="card-title">{date}</div>
          <div className="space-y-1.5">
            {list.map((n) => (
              <div key={n.id} className="card !py-2 flex items-start gap-2">
                <div className="flex-1 text-sm whitespace-pre-wrap break-words">{n.content}</div>
                <span className="muted mono text-[0.65rem]">{String(n.created_at || "").slice(11, 16)}</span>
                <button className="muted px-1" onClick={() => remove(n.id)}>×</button>
              </div>
            ))}
          </div>
        </div>
      ))}
      {!loading && notes.length === 0 && <div className="muted text-sm text-center">暂无记录</div>}
    </div>
  );
}
