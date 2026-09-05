import { getSetting } from "./db";

// 当前官方模型（2025-2026 版）：deepseek-v4-flash 日常 / deepseek-v4-pro 深度推理
export const MODELS = {
  flash: "deepseek-v4-flash",
  pro: "deepseek-v4-pro",
};

const API_URL = "https://api.deepseek.com/chat/completions";

export function getApiKey(): string | null {
  const env = process.env.DEEPSEEK_API_KEY;
  if (env && env.trim()) return env.trim();
  const dbKey = getSetting("api_key");
  if (dbKey && dbKey.trim()) return dbKey.trim();
  return null;
}

export class ApiKeyError extends Error {
  constructor() {
    super("未配置 DeepSeek API Key");
    this.name = "ApiKeyError";
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chatCompletion(opts: {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  timeoutMs?: number;
}): Promise<any> {
  const key = getApiKey();
  if (!key) throw new ApiKeyError();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 120000);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        stream: false,
        temperature: opts.temperature ?? 0.7,
      }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = data?.error?.message || `HTTP ${res.status}`;
      throw new Error(`DeepSeek API 错误：${msg}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export function extractReply(data: any): string {
  return data?.choices?.[0]?.message?.content ?? "";
}

// 从模型输出中提取 JSON 对象（容忍代码块包裹）
export function extractJson(text: string): any {
  let t = text.trim();
  t = t.replace(/^```(json)?\s*/i, "").replace(/```\s*$/, "");
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(t.slice(start, end + 1));
    } catch {
      /* 继续尝试 */
    }
  }
  return null;
}
