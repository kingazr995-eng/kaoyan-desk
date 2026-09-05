import { NextRequest, NextResponse } from "next/server";
import { all, getSetting, daysAgoStr } from "@/lib/db";
import { chatCompletion, extractReply, extractJson } from "@/lib/deepseek";

export const dynamic = "force-dynamic";

function fmtDate(x: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
}

// AI 生成月/周/日计划（读备考档案 + 当前进度）
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  let profile: any = {};
  try { profile = JSON.parse(getSetting("profile") || "{}"); } catch { /* 忽略 */ }

  const logs = all("SELECT date, content, subject FROM study_logs WHERE date >= ? ORDER BY date", daysAgoStr(6));
  const focus = all(
    "SELECT subject, SUM(length_min) AS m FROM pomodoros WHERE status = 'done' AND date(created_at) >= ? GROUP BY subject",
    daysAgoStr(6)
  );
  const dates: string[] = [];
  const d = new Date();
  for (let i = 0; i < 7; i++) {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    dates.push(fmtDate(x));
  }

  const sideNote = String(body.sideNote || "").trim();
  const prompt = `你是考研备考规划助手。根据下面的信息生成未来7天学习计划，只输出一个 JSON 对象（不要 markdown 代码块，不要额外文字）：
{"monthGoal":"一句话月目标","weekGoal":"一句话周目标","days":[{"date":"YYYY-MM-DD","tasks":["","",""]}]}
规则：
1. 每天固定 3 件小事，带时段，量要克制——坚持比数量重要
2. 四科轮转（数学/英语/政治/专业课），每天主攻 1-2 科
3. 严格结合用户档案和当前进度，不要凭空定目标
4. 用中文，任务要具体可执行（如"9:00 高数极限 1 节+3 题"）

用户档案：${JSON.stringify(profile) || "（未填写，请给保守建议）"}
本周已签到：${logs.length > 0 ? JSON.stringify(logs) : "（无）"}
近7天各科投入（分钟）：${focus.length > 0 ? JSON.stringify(focus) : "（无）"}
未来7天日期：${dates.join(", ")}
${sideNote ? "本周侧重：" + sideNote : ""}`;

  try {
    // 用 pro：结构化规划生成 flash 会异常慢/卡，pro 稳定且擅长推理
    const data = await chatCompletion({
      model: "deepseek-v4-pro",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      timeoutMs: 180000,
    });
    const text = extractReply(data);
    const parsed = extractJson(text);
    if (!parsed || !Array.isArray(parsed.days)) {
      return NextResponse.json({ error: "AI 输出解析失败，请重试", raw: text.slice(0, 500) }, { status: 400 });
    }
    return NextResponse.json({ plan: parsed });
  } catch (e: any) {
    const hint = e?.name === "ApiKeyError" ? "未配置 DeepSeek API Key（设置页填写）" : e?.message || "AI 请求失败";
    return NextResponse.json({ error: hint }, { status: 400 });
  }
}
