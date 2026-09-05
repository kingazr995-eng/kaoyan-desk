// 学科/模块定义（前端与后端共用）
export const SUBJECTS = [
  { key: "math", name: "数学", short: "数" },
  { key: "eng", name: "英语", short: "英" },
  { key: "pol", name: "政治", short: "政" },
  { key: "elec", name: "专业课", short: "专" },
  { key: "fitness", name: "健身", short: "健" },
  { key: "other", name: "其他", short: "其" },
] as const;

export const SUBJECT_NAME: Record<string, string> = Object.fromEntries(
  SUBJECTS.map((s) => [s.key, s.name])
);

export const SUBJECT_TAG: Record<string, string> = {
  math: "tag-math",
  eng: "tag-eng",
  pol: "tag-pol",
  elec: "tag-elec",
  work: "tag-work",
  fitness: "tag-fitness",
  other: "tag-other",
};

export const STUDY_SUBJECTS = SUBJECTS.filter((s) =>
  ["math", "eng", "pol", "elec"].includes(s.key)
);

// 一键加任务的原子化建议（点击即加入今日任务）
export const QUICK_TASKS = [
  { title: "完成3道极限计算题", subject: "math", plannedMin: 20 },
  { title: "背诵20个政治概念", subject: "pol", plannedMin: 10 },
  { title: "拆解1篇阅读真题", subject: "eng", plannedMin: 25 },
  { title: "1套电路真题选择部分", subject: "elec", plannedMin: 30 },
];
