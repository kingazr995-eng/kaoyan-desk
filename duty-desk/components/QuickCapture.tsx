"use client";
import { useState } from "react";
import { api } from "@/lib/client";

export default function QuickCapture({ kind = "quick", placeholder = "备考想法/待办，一句话记下…", linkHref, linkLabel, onSaved }: {
  kind?: "quick" | "fde";
  placeholder?: string;
  linkHref?: string;
  linkLabel?: string;
  onSaved?: () => void;
}) {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await api("/api/notes", { method: "POST", body: { content: text.trim(), kind } });
      setText("");
      setMsg(kind === "fde" ? "✓ 已记入FDE（边角时间再看）" : "✓ 已记录");
      onSaved?.();
      setTimeout(() => setMsg(""), 2500);
    } catch (e: any) { setMsg(e.message); }
    setSaving(false);
  };

  return (
    <div>
      <div className="flex gap-2">
        <input className="input flex-1" placeholder={placeholder} value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()} />
        <button className="btn" onClick={save} disabled={saving}>记下</button>
      </div>
      <div className="mt-1 flex justify-between text-xs">
        <span style={{ color: "var(--accent)" }}>{msg}</span>
        {linkHref && <a className="muted" href={linkHref}>{linkLabel || "查看全部 →"}</a>}
      </div>
    </div>
  );
}
