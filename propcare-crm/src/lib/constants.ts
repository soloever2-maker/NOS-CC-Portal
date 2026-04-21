// ─────────────────────────────────────────────
//  NATIONS OF SKY — PROJECTS LIST
//  لإضافة مشروع جديد: أضف سطر جديد في الـ array
// ─────────────────────────────────────────────

export const NOS_PROJECTS = [
  "Jirian Campaign",
  "Sky Ridge Elite",
  "Zomra",
  "Upviews",
  "ISLA",
  "Sky Ridge Executives",
  "Jirian Island Campaign",
  "Augusta",
] as const;

export type NOSProject = (typeof NOS_PROJECTS)[number];
