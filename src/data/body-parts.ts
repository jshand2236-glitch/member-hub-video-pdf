// 動画を分類する部位。並び順はこの配列の順（頭側 → 足側）。
// slug は DB (videos.body_part) と URL (?part=) に使うので、変更しないこと。
export const BODY_PARTS = [
  { slug: "neck", label: "頸部", en: "Neck" },
  { slug: "shoulder", label: "肩", en: "Shoulder" },
  { slug: "elbow", label: "肘", en: "Elbow" },
  { slug: "wrist-hand", label: "手関節・手指", en: "Wrist & Hand" },
  { slug: "thoracic", label: "胸背部", en: "Thoracic" },
  { slug: "lumbar", label: "腰部", en: "Lumbar" },
  { slug: "hip", label: "股関節", en: "Hip" },
  { slug: "knee", label: "膝", en: "Knee" },
  { slug: "ankle-foot", label: "足関節・足部", en: "Ankle & Foot" },
  { slug: "general", label: "全身・その他", en: "General" },
] as const;

export type BodyPartSlug = (typeof BODY_PARTS)[number]["slug"];
export type BodyPart = (typeof BODY_PARTS)[number];

export const UNCATEGORIZED = { slug: "uncategorized", label: "未分類", en: "Other" } as const;

export function findBodyPart(slug: string | null | undefined): BodyPart | undefined {
  return BODY_PARTS.find((p) => p.slug === slug);
}

export function isBodyPartSlug(value: string): value is BodyPartSlug {
  return BODY_PARTS.some((p) => p.slug === value);
}
