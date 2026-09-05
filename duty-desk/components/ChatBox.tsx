"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";

export default function ChatBox() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await api("/api/chat");
      setMessages(r.messages || []);
      setErr("");
    } catch (e: any) { setErr(e.message); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setErr("");
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    try {
      const r = await api("/api/chat", { method: "POST", body: { messages: [...history, { role: "user", content: text }] } });
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: "user", content: text },
        { id: Date.now() + 1, role: "assistant", content: r.reply },
      ]);
      setInput("");
    } catch (e: any) {
      setErr(e.message + "（可在「设置」中检查 API Key）");
    }
    setBusy(false);
  };

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col md:h-[calc(100dvh-6.5rem)]">
      <div className="muted text-xs mb-2">通用助手 · deepseek-v4-flash{busy ? " · 思考中…" : ""}</div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
        {messages.length === 0 && !busy && (
          <div className="muted text-sm text-center py-10">
            直接输入问题，AI 简洁作答。无需录入任何资料。
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className="max-w-[85%] whitespace-pre-wrap break-words text-sm rounded-xl px-3 py-2"
              style={m.role === "user"
                ? { background: "var(--accent)", color: "#0d0d0d" }
                : { background: "var(--card)", border: "1px solid var(--border)" }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="text-sm rounded-xl px-3 py-2" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <span className="pulse-dot" />AI 思考中…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {err && <div className="text-xs mt-1" style={{ color: "var(--danger)" }}>{err}</div>}

      <div className="flex gap-2 pt-2">
        <textarea
          className="input flex-1 !min-h-[2.8rem]"
          rows={1}
          placeholder="输入问题，Enter发送"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <button className="btn" onClick={send} disabled={busy || !input.trim()}>发送</button>
      </div>
    </div>
  );
}
