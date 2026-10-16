import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { BODY_PARTS, type BodyPart } from "@/data/body-parts";

/**
 * Display order of the categories on /videos and /pdfs (and in /admin):
 * the body parts plus the オフラインセミナー group for videos. Admins change
 * it with ↑↓ buttons; it is stored as a JSON array in site_settings.
 * Unknown slugs are ignored and any missing ones are appended in the default
 * (head-to-foot) order, so adding a body part later never breaks it.
 */

export const SEMINAR_SLUG = "seminar";
export const SEMINAR_LABEL = "オフラインセミナー";
const KEY = "partOrder";
const DEFAULT_ORDER = [SEMINAR_SLUG, ...BODY_PARTS.map((p) => p.slug)];

function normalize(saved: unknown): string[] {
  const list = Array.isArray(saved) ? saved.filter((s): s is string => typeof s === "string") : [];
  const known = list.filter((s, i) => DEFAULT_ORDER.includes(s) && list.indexOf(s) === i);
  return [...known, ...DEFAULT_ORDER.filter((s) => !known.includes(s))];
}

export async function getPartOrder(): Promise<string[]> {
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, KEY)).limit(1);
  if (!row) return DEFAULT_ORDER;
  try {
    return normalize(JSON.parse(row.value));
  } catch {
    return DEFAULT_ORDER;
  }
}

/** Body parts sorted by the saved order (the seminar entry is skipped). */
export function orderedBodyParts(order: string[]): BodyPart[] {
  return [...BODY_PARTS].sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
}

export function categoryLabel(slug: string): string {
  return slug === SEMINAR_SLUG ? SEMINAR_LABEL : (BODY_PARTS.find((p) => p.slug === slug)?.label ?? slug);
}

export async function movePart(slug: string, direction: "up" | "down") {
  const order = await getPartOrder();
  const i = order.indexOf(slug);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i === -1 || j < 0 || j >= order.length) return;
  [order[i], order[j]] = [order[j], order[i]];
  const value = JSON.stringify(order);
  await db
    .insert(siteSettings)
    .values({ key: KEY, value })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
}
