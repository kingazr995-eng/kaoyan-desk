import { NextRequest, NextResponse } from "next/server";
import { all, run } from "@/lib/db";
import { chatCompletion, extractReply } from "@/lib/deepseek";
import { GENERAL_PROMPT } from "@/lib/prompts";

export const dynamic = "force-dynamic";

export async function GET() {
  const messages = all("SELECT * FROM chat_messages ORDER BY id DESC LIMIT 50").reverse();
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const userMessages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  const lastUser = userMessages.filter((m: any) => m.role === "user").pop();
  if (!lastUser || !String(lastUser.content).trim()) {
    return NextResponse.json({ error: "消息不能为空" }, { status: 400 });
  }

  let data: any;
  try {
    data = await chatCompletion({
      model: "deepseek-v4-flash",
      messages: [{ role: "system", content: GENERAL_PROMPT }, ...userMessages],
      temperature: 0.7,
      timeoutMs: 150000,
    });
  } catch (e: any) {
    const hint =
      e?.name === "ApiKeyError"
        ? "未配置 DeepSeek API Key：请到「设置」页填写"
        : e?.message || "AI 请求失败";
    return NextResponse.json({ error: hint }, { status: 400 });
  }
  const reply = extractReply(data);

  run("INSERT INTO chat_messages (role, content) VALUES ('user', ?)", String(lastUser.content).slice(0, 4000));
  run("INSERT INTO chat_messages (role, content) VALUES ('assistant', ?)", reply.slice(0, 12000));

  return NextResponse.json({ reply, model: "deepseek-v4-flash" });
}
