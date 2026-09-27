import { and, count, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { rateLimitEvents } from "@/db/schema";

/**
 * Simple sliding-window rate limiting backed by Postgres (no extra service
 * needed). Each limited action inserts a row into rate_limit_events under a
 * "bucket" key; an action is allowed while the bucket has fewer than `max`
 * rows younger than `windowMs`.
 */

export const LIMITS = {
  // Failed password attempts for one account.
  loginFailPerEmail: { max: 5, windowMs: 15 * 60_000 },
  // All login attempts from one IP (stops spraying many accounts).
  loginPerIp: { max: 30, windowMs: 15 * 60_000 },
  // New accounts from one IP.
  registerPerIp: { max: 5, windowMs: 60 * 60_000 },
  // Password-reset mails for one address / from one IP.
  resetPerEmail: { max: 3, windowMs: 60 * 60_000 },
  resetPerIp: { max: 10, windowMs: 60 * 60_000 },
} as const;

type Limit = { max: number; windowMs: number };

export async function isLimited(bucket: string, limit: Limit): Promise<boolean> {
  const since = new Date(Date.now() - limit.windowMs);
  const [row] = await db
    .select({ n: count() })
    .from(rateLimitEvents)
    .where(and(eq(rateLimitEvents.bucket, bucket), gt(rateLimitEvents.createdAt, since)));
  return (row?.n ?? 0) >= limit.max;
}

export async function recordEvent(bucket: string) {
  await db.insert(rateLimitEvents).values({ bucket });
  // Prune now and then so the table stays small.
  if (Math.random() < 0.05) {
    await db
      .delete(rateLimitEvents)
      .where(lt(rateLimitEvents.createdAt, new Date(Date.now() - 24 * 60 * 60_000)));
  }
}

/** Checks the limit and, if still allowed, records this attempt. */
export async function consume(bucket: string, limit: Limit): Promise<boolean> {
  if (await isLimited(bucket, limit)) return false;
  await recordEvent(bucket);
  return true;
}

export async function clearBucket(bucket: string) {
  await db.delete(rateLimitEvents).where(eq(rateLimitEvents.bucket, bucket));
}

/** Best-effort client IP from request headers (Netlify sets x-nf-client-connection-ip). */
export function clientIp(h: Headers): string {
  return (
    h.get("x-nf-client-connection-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}
