import { all } from "./db";

export function isComplete(c: any): boolean {
  return !!(c && c.done1 && c.done2 && c.done3 && (c.task1 || c.task2 || c.task3));
}

function fmtDate(x: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

// 学习连续天数（冷启动期唯一指标）：今天未完成则从昨天起算
export function calcStudyStreak(): number {
  const cards = all<any>("SELECT * FROM daily_cards ORDER BY date DESC");
  const map = new Map(cards.map((c) => [String(c.date), c]));
  const d = new Date();
  if (!isComplete(map.get(fmtDate(d)))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (isComplete(map.get(fmtDate(d)))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
