import { DatabaseSync } from "node:sqlite";
const db = new DatabaseSync("data/desk.db");
for (const t of ["tasks", "pomodoros", "interruptions", "fitness_logs", "notes", "chat_messages", "goals", "daily_cards"]) {
  db.exec("DELETE FROM " + t);
}
db.exec("DELETE FROM settings WHERE key IN ('work_templates','last_weekly_report')");
// 废弃的旧表（学习/知识/工作模块已移除）直接丢弃
for (const t of ["wrong_answers", "work_logs", "kb_docs", "kb_chunks", "chapters", "exam_papers"]) {
  try { db.exec("DROP TABLE IF EXISTS " + t); } catch {}
}
console.log("cleanup done");
