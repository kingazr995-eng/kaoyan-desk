import { NextResponse } from "next/server";
import { all } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const tables = ["tasks", "pomodoros", "interruptions", "fitness_logs", "notes", "chat_messages", "settings", "goals", "daily_cards", "study_logs", "plans"];
  const data: Record<string, any[]> = {};
  for (const t of tables) data[t] = all(`SELECT * FROM ${t}`);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="duty-desk-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
