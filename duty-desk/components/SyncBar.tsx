"use client";
import { useEffect, useState } from "react";
import { isOnline, getPendingCount, syncNow } from "@/lib/client";

export default function SyncBar() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [pending, setPending] = useState(0);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const check = async () => {
      const on = await isOnline();
      setOnline(on);
      setPending(getPendingCount());
    };
    check();
    const iv = setInterval(check, 30000);
    return () => clearInterval(iv);
  }, []);

  const doSync = async () => {
    setBusy(true);
    const n = await syncNow();
    setPending(getPendingCount());
    setMsg(n > 0 ? `✓ 已同步 ${n} 条` : "没有待同步内容");
    setTimeout(() => setMsg(""), 2500);
    setBusy(false);
  };

  if (online === null) return null;
  if (online && pending === 0) return null;

  return (
    <div className="card flex items-center gap-2 !py-2.5" style={{ borderColor: online ? "var(--ok)" : "var(--warn)" }}>
      <span className="text-sm" style={{ color: online ? "var(--ok)" : "var(--warn)" }}>
        {online ? "● 在线" : "○ 离线模式（可继续记，联网后同步）"}
      </span>
      {online && pending > 0 && (
        <>
          <span className="muted text-xs flex-1">{pending} 条离线记录待同步</span>
          <button className="btn btn-sm" onClick={doSync} disabled={busy}>{busy ? "同步中" : "立即同步"}</button>
        </>
      )}
      {msg && <span className="text-xs" style={{ color: "var(--ok)" }}>{msg}</span>}
    </div>
  );
}
