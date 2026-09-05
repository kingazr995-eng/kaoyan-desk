"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";

export default function FitnessCheck() {
  const [plan, setPlan] = useState<string[]>([]);
  const [doneSet, setDoneSet] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<any[]>([]);
  const [planText, setPlanText] = useState("");
  const [showPlan, setShowPlan] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await api("/api/fitness");
      setPlan(r.plan || []);
      setPlanText((r.plan || []).join("\n"));
      setDoneSet(new Set((r.today || []).map((x: any) => x.plan)));
      setHistory(r.history || []);
    } catch { /* 忽略 */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const checkin = async (item: string) => {
    try {
      await api("/api/fitness", { method: "POST", body: { action: "checkin", plan: item } });
      setDoneSet((prev) => {
        const next = new Set(prev);
        if (next.has(item)) next.delete(item); else next.add(item);
        return next;
      });
      load();
    } catch (e: any) { setMsg(e.message); }
  };

  const savePlan = async () => {
    try {
      await api("/api/fitness", { method: "POST", body: { action: "save_plan", plan: planText } });
      setShowPlan(false);
      load();
      setMsg("✓ 固定计划已保存，打卡即走");
      setTimeout(() => setMsg(""), 2000);
    } catch (e: any) { setMsg(e.message); }
  };

  const allDone = plan.length > 0 && plan.every((p) => doneSet.has(p));

  return (
    <div className="space-y-3">
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="card-title !mb-0">今日打卡 {doneSet.size}/{plan.length}</div>
          <button className="btn btn-sm btn-ghost" onClick={() => setShowPlan(!showPlan)}>编辑计划</button>
        </div>
        {showPlan && (
          <div className="mt-2 space-y-2">
            <textarea className="input" rows={4} value={planText} onChange={(e) => setPlanText(e.target.value)}
              placeholder={"每行一个动作，例：\n俯卧撑 3组x15\n深蹲 3组x20"} />
            <button className="btn btn-sm" onClick={savePlan}>保存计划</button>
          </div>
        )}
        <div className="mt-2 space-y-2">
          {plan.map((p) => (
            <button key={p} className="flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left"
              style={{ borderColor: doneSet.has(p) ? "var(--ok)" : "var(--border)", background: doneSet.has(p) ? "var(--tag-eng-bg)" : "transparent" }}
              onClick={() => checkin(p)}>
              <span className="text-base" style={{ color: doneSet.has(p) ? "var(--ok)" : "var(--muted)" }}>
                {doneSet.has(p) ? "✓" : "○"}
              </span>
              <span className={"flex-1 text-sm " + (doneSet.has(p) ? "line-through" : "")}>{p}</span>
            </button>
          ))}
          {plan.length === 0 && <div className="muted text-sm">还没有计划，点「编辑计划」添加（每行一个动作）</div>}
        </div>
        {allDone && <div className="mt-2 text-sm font-semibold" style={{ color: "var(--ok)" }}>✓ 今日全部完成，收工</div>}
      </div>

      <div className="card">
        <div className="card-title">最近14天打卡</div>
        <div className="flex flex-wrap gap-1.5">
          {history.map((h) => (
            <span key={h.date} className="tag tag-fitness">
              {String(h.date).slice(5)} ×{h.count}
            </span>
          ))}
          {history.length === 0 && <span className="muted text-sm">暂无记录</span>}
        </div>
      </div>
      {msg && <div className="text-sm" style={{ color: "var(--accent)" }}>{msg}</div>}
    </div>
  );
}
