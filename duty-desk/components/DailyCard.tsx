"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";

export default function DailyCard() {
  const [card, setCard] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [isSunday, setIsSunday] = useState(false);
  const [yesterdayNote, setYesterdayNote] = useState<string>("");
  const [showReview, setShowReview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [offlineMsg, setOfflineMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await api("/api/daily");
      setCard(r.card);
      setStreak(r.streak);
      setIsSunday(!!r.isSunday);
      setYesterdayNote(r.yesterdayNote || "");
    } catch { /* 忽略 */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (patch: any = {}) => {
    if (!card) return;
    try {
      const r = await api("/api/daily", {
        method: "POST",
        body: {
          date: card.date,
          task1: card.task1, task2: card.task2, task3: card.task3,
          done1: card.done1, done2: card.done2, done3: card.done3,
          ...patch,
        },
      });
      setCard(r.card);
      setStreak(r.streak);
      setSaved(true);
      setOfflineMsg("");
      setTimeout(() => setSaved(false), 1500);
    } catch (e: any) {
      setOfflineMsg(e?.message || "");
      setTimeout(() => setOfflineMsg(""), 2000);
    }
  };

  const toggle = (i: number) => {
    const key = `done${i}`;
    const next = { ...card, [key]: card[key] ? 0 : 1 };
    setCard(next);
    save({ [key]: next[key] });
  };

  const setTask = (i: number, v: string) => {
    setCard({ ...card, [`task${i}`]: v });
  };

  const doneCount = [card?.done1, card?.done2, card?.done3].filter(Boolean).length;
  const allDone = doneCount === 3 && (card?.task1 || card?.task2 || card?.task3);

  if (!card) return <div className="card muted text-sm">加载今日卡…</div>;

  return (
    <div className="card" style={{ borderColor: "rgba(212,168,67,.30)" }}>
      <div className="flex items-center justify-between mb-1">
        <div className="card-title !mb-0">今日三件 · 早锚定 / 晚核对</div>
        <div className="mono text-sm font-bold" style={{ color: allDone ? "var(--ok)" : "var(--accent)" }}>
          {allDone ? `✓ 连续 ${streak} 天` : `连续 ${streak} 天 · ${doneCount}/3`}
        </div>
      </div>

      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2 mt-1.5">
          <button
            className="btn btn-sm btn-ghost !px-2 mono"
            style={{ color: card[`done${i}`] ? "var(--ok)" : "var(--faint)" }}
            onClick={() => toggle(i)}
          >
            {card[`done${i}`] ? "✓" : "○"}
          </button>
          <input
            className="input !py-1.5"
            placeholder={`第 ${i} 件：如 7:00–7:30 背词30`}
            value={card[`task${i}`] || ""}
            onChange={(e) => setTask(i, e.target.value)}
            onBlur={() => save()}
          />
        </div>
      ))}

      {/* 晚复盘 */}
      <div className="mt-2" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.5rem" }}>
        <button className="text-xs font-semibold" style={{ color: "var(--accent)" }} onClick={() => setShowReview(!showReview)}>
          {showReview ? "收起晚复盘 ▲" : "晚复盘（3分钟：学了啥 / 卡在哪 / 明天干啥）▽"}
        </button>
        {showReview && (
          <textarea
            className="input mt-1.5"
            rows={2}
            placeholder={"卡在哪：…\n明天干啥：…"}
            value={card.note || ""}
            onChange={(e) => setCard({ ...card, note: e.target.value })}
            onBlur={() => save()}
          />
        )}
      </div>
      {yesterdayNote && !showReview && (
        <div className="muted text-xs mt-1 truncate">昨日复盘：{yesterdayNote}</div>
      )}

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="muted" style={offlineMsg ? { color: "var(--warn)" } : {}}>
          {offlineMsg || (saved ? "已保存" : allDone ? "今天没断，睡前核对一下即可" : "写三件小事，勾完即算一天没断")}
        </span>
        {isSunday && (
          <Link href="/stats" className="font-semibold" style={{ color: "var(--accent)" }}>
            今天周日 · 周核对 →
          </Link>
        )}
      </div>
    </div>
  );
}
