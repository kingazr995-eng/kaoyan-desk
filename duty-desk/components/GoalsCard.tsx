"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";

export default function GoalsCard() {
  const [goals, setGoals] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("10");
  const [unit, setUnit] = useState("次");
  const [period, setPeriod] = useState("周");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await api("/api/goals");
      setGoals(r.goals || []);
    } catch { /* 忽略 */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!title.trim()) return;
    try {
      await api("/api/goals", { method: "POST", body: { title: title.trim(), targetValue: Number(target) || 1, unit, period } });
      setTitle(""); setShowAdd(false);
      load();
    } catch (e: any) { setMsg(e.message); }
  };

  const bump = async (g: any, delta: number) => {
    try {
      await api(`/api/goals/${g.id}`, { method: "PATCH", body: { currentValue: Number(g.current_value) + delta } });
      load();
    } catch (e: any) { setMsg(e.message); }
  };

  const finish = async (g: any) => {
    try {
      await api(`/api/goals/${g.id}`, { method: "PATCH", body: { status: g.status === "done" ? "active" : "done" } });
      load();
    } catch (e: any) { setMsg(e.message); }
  };

  const del = async (id: number) => {
    try { await api(`/api/goals/${id}`, { method: "DELETE" }); load(); } catch { /* 忽略 */ }
  };

  const active = goals.filter((g) => g.status === "active");
  const done = goals.filter((g) => g.status === "done");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="card-title !mb-0">目标进度（growth-board 式）</div>
        <button className="btn btn-sm btn-ghost" onClick={() => setShowAdd(!showAdd)}>{showAdd ? "收起" : "+ 新目标"}</button>
      </div>

      {showAdd && (
        <div className="space-y-2" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.5rem" }}>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="目标：如 数学刷题" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input className="input !w-16" type="number" min={1} value={target} onChange={(e) => setTarget(e.target.value)} />
          </div>
          <div className="flex gap-2 items-center">
            <select className="input !w-auto" value={unit} onChange={(e) => setUnit(e.target.value)}>
              {["次", "道", "题", "篇", "章", "套", "个"].map((u) => <option key={u}>{u}</option>)}
            </select>
            <select className="input !w-auto" value={period} onChange={(e) => setPeriod(e.target.value)}>
              {["周", "月", "长期"].map((p) => <option key={p}>{p}</option>)}
            </select>
            <span className="muted text-xs flex-1">目标值 × {unit} / {period}</span>
            <button className="btn btn-sm" onClick={add}>添加</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {active.map((g) => {
          const pct = Math.min(100, Math.round((Number(g.current_value) / Math.max(0.01, Number(g.target_value))) * 100));
          return (
            <div key={g.id}>
              <div className="flex items-center gap-2 text-sm">
                <span className={"flex-1 truncate " + (pct >= 100 ? "line-through" : "")}>{g.title}</span>
                <span className="muted mono text-xs">{g.current_value}/{g.target_value} {g.unit}</span>
                <button className="btn btn-sm btn-ghost !px-2" onClick={() => bump(g, 1)}>+1</button>
                <button className="btn btn-sm btn-ghost !px-2" onClick={() => finish(g)}>{pct >= 100 ? "✓" : "完"}</button>
                <button className="muted px-1" onClick={() => del(g.id)}>×</button>
              </div>
              <div className="stat-bar mt-1" style={{ height: "0.4rem" }}>
                <div style={{ width: pct + "%", background: pct >= 100 ? "var(--ok)" : "var(--accent)", transition: "width .4s" }} />
              </div>
            </div>
          );
        })}
        {active.length === 0 && <div className="muted text-sm">暂无进行中的目标。建议：数学刷题 20道/周、专业课真题 3套/周</div>}
        {done.length > 0 && (
          <div className="muted text-xs" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.4rem" }}>
            已完成：{done.map((g) => g.title).join("、")}
          </div>
        )}
      </div>
      {msg && <div className="text-xs" style={{ color: "var(--danger)" }}>{msg}</div>}
    </div>
  );
}
