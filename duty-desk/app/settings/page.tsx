"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";

export default function SettingsPage() {
  const [cfg, setCfg] = useState<any>(null);
  const [key, setKey] = useState("");
  const [examDate, setExamDate] = useState("");
  const [profile, setProfile] = useState<any>({});
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState("");
  const [cloudMsg, setCloudMsg] = useState("");

  const load = () =>
    api("/api/config")
      .then((c) => { setCfg(c); if (c.examDate) setExamDate(c.examDate); setProfile(c.profile || {}); })
      .catch(() => {});

  const baseUrl = () => (typeof window !== "undefined" ? window.location.origin : "");
  const copyLink = async (href: string) => {
    try {
      await navigator.clipboard.writeText(baseUrl() + href);
      setCopied(href);
      setTimeout(() => setCopied(""), 2000);
    } catch { /* 忽略 */ }
  };
  useEffect(() => {
    load();
  }, []);

  const pushCloud = async () => {
    setCloudMsg("推送中…");
    try {
      const r = await api("/api/cloud/sync", { method: "POST", body: { action: "push" } });
      setCloudMsg(r.ok ? "✓ 已同步到坚果云" : (r.error || "推送失败"));
    } catch (e: any) { setCloudMsg(e.message); }
    setTimeout(() => setCloudMsg(""), 3000);
  };
  const pullCloud = async () => {
    if (!confirm("从云端恢复会覆盖本地数据，确定？")) return;
    setCloudMsg("拉取中…");
    try {
      const r = await api("/api/cloud/sync", { method: "POST", body: { action: "pull" } });
      setCloudMsg(r.ok ? "✓ 已从云端恢复" : (r.error || "拉取失败"));
    } catch (e: any) { setCloudMsg(e.message); }
    setTimeout(() => setCloudMsg(""), 3000);
  };

  const saveKey = async () => {
    try {
      await api("/api/config", { method: "POST", body: { apiKey: key } });
      setKey("");
      setMsg("✓ 已保存");
      await load();
    } catch (e: any) { setMsg(e.message); }
    setTimeout(() => setMsg(""), 2500);
  };

  const saveProfile = async () => {
    try {
      await api("/api/config", { method: "POST", body: { profile } });
      setMsg("✓ 档案已保存");
      setTimeout(() => setMsg(""), 2000);
    } catch (e: any) { setMsg(e.message); }
  };

  const saveExam = async () => {
    try {
      await api("/api/config", { method: "POST", body: { examDate: examDate } });
      setMsg("✓ 初试日期已更新");
      await load();
    } catch (e: any) { setMsg(e.message); }
    setTimeout(() => setMsg(""), 2500);
  };

  const clearKey = async () => {
    try {
      await api("/api/config", { method: "POST", body: { apiKey: "" } });
      setMsg("已清除");
      await load();
    } catch (e: any) { setMsg(e.message); }
    setTimeout(() => setMsg(""), 2500);
  };

  return (
    <div className="space-y-3 md:mx-auto md:max-w-2xl">
      <h1 className="text-xl font-bold md:text-2xl">设置</h1>

      <div className="card">
        <div className="card-title">DeepSeek API</div>
        {cfg && (
          <div className="text-sm mb-2">
            {cfg.hasKey
              ? <>状态：<span style={{ color: "var(--ok)" }}>✓ 已配置</span>（{cfg.keyMask} · 来源：{cfg.source === "env" ? ".env.local" : "网页保存"}）</>
              : <>状态：<span style={{ color: "var(--danger)" }}>✗ 未配置</span> —— 错题分析/文书生成/AI助手暂不可用</>}
          </div>
        )}
        <input className="input" type="password" placeholder="sk-…（也可写入项目 .env.local）" value={key}
          onChange={(e) => setKey(e.target.value)} />
        <div className="mt-2 flex gap-2">
          <button className="btn btn-sm" onClick={saveKey} disabled={!key.trim()}>保存Key</button>
          {cfg?.hasKey && <button className="btn btn-sm btn-ghost" onClick={clearKey}>清除</button>}
          <a className="btn btn-sm btn-ghost" href="https://platform.deepseek.com" target="_blank" rel="noreferrer">获取Key ↗</a>
        </div>
        {msg && <div className="text-xs mt-2" style={{ color: "var(--accent)" }}>{msg}</div>}
      </div>

      <div className="card">
        <div className="card-title">考研初试日期</div>
        <div className="text-sm mb-2">倒计时目标日期（2027考研初试预计 2026-12-19，以官方公布为准）</div>
        <div className="flex gap-2">
          <input className="input" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
          <button className="btn btn-sm" onClick={saveExam}>保存</button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">备考档案（AI 生成计划用）</div>
        <div className="space-y-2">
          <input className="input" placeholder="目标院校专业，如 长沙理工 电气专硕" value={profile.school || ""} onChange={(e) => setProfile({ ...profile, school: e.target.value })} />
          <select className="input" value={profile.stage || ""} onChange={(e) => setProfile({ ...profile, stage: e.target.value })}>
            <option value="">当前阶段</option>
            {["休整", "冷启动", "Phase1 基础", "Phase2 强化", "Phase3 真题", "Phase4 冲刺"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className="input" placeholder="每天可学时长，如 5小时" value={profile.hoursPerDay || ""} onChange={(e) => setProfile({ ...profile, hoursPerDay: e.target.value })} />
          <textarea className="input" rows={2} placeholder="各科当前进度，如 数学高数第2章、电路没开始" value={profile.progress || ""} onChange={(e) => setProfile({ ...profile, progress: e.target.value })} />
          <textarea className="input" rows={2} placeholder="薄弱项，如 数学积分、英语长难句" value={profile.weakness || ""} onChange={(e) => setProfile({ ...profile, weakness: e.target.value })} />
          <div className="flex gap-2 items-center">
            <span className="muted text-xs">每周休息日</span>
            <select className="input !w-auto" value={profile.restDay || "sunday"} onChange={(e) => setProfile({ ...profile, restDay: e.target.value })}>
              {[["sunday", "周日"], ["none", "不休"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <button className="btn btn-sm" onClick={saveProfile}>保存档案</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">云端同步（坚果云）</div>
        <div className="muted text-xs mb-2">账号已内置，数据变更后自动同步到坚果云；也可手动操作</div>
        <div className="flex gap-2">
          <button className="btn btn-sm btn-ghost-accent" onClick={pushCloud}>立即推送</button>
          <button className="btn btn-sm btn-ghost" onClick={pullCloud}>从云恢复</button>
        </div>
        {cloudMsg && <div className="text-xs mt-1.5" style={{ color: "var(--accent)" }}>{cloudMsg}</div>}
      </div>

      <div className="card">
        <div className="card-title">数据</div>
        <div className="space-y-2 text-sm">
          <div className="muted text-xs">所有数据存本地：duty-desk/data/desk.db（SQLite）。删除该文件即清空全部数据。</div>
          <a className="btn btn-sm btn-ghost" href="/api/export">导出全部数据 (JSON)</a>
        </div>
      </div>

      <div className="card">
        <div className="card-title">快捷指令（URL 一键触发）</div>
        <div className="space-y-1.5 text-sm">
          {[
            { label: "开始25分钟番茄", href: "/pomodoro?auto=1&len=25" },
            { label: "开始50分钟番茄", href: "/pomodoro?auto=1&len=50" },
            { label: "快速记录一条（把「这里写内容」换成想记的）", href: "/notes?text=这里写内容" },
          ].map((s) => (
            <div key={s.href} className="flex items-center gap-2">
              <span className="flex-1 truncate">{s.label}</span>
              <button className="btn btn-sm btn-ghost" onClick={() => copyLink(s.href)}>复制链接</button>
            </div>
          ))}
          <div className="muted text-xs pt-1">
            用法：iOS「快捷指令」App → 添加操作「打开URL」→ 粘贴链接（可加「询问每次运行」输入变量）；Android/浏览器 → 收藏书签。
            链接自动带上本机地址（{baseUrl()}），手机打开即可用。
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">手机访问</div>
        <div className="text-sm muted">
          同一WiFi下：手机浏览器打开 <span className="mono text-xs">http://电脑局域网IP:3000</span>。查看方法：系统设置 → Wi-Fi → 详细信息 → IP地址。
          远程访问见项目 README（内网穿透方案）。
        </div>
      </div>
    </div>
  );
}
