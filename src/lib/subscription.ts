import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { and, desc, eq, or } from "drizzle-orm";

const ACTIVE_STATUSES = ["active", "trialing"] as const;

/**
 * Returns true if the given user currently has an active (or trialing)
 * subscription that has not expired.
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const now = new Date();
  const rows = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        or(eq(subscriptions.status, "active"), eq(subscriptions.status, "trialing")),
      ),
    )
    .orderBy(desc(subscriptions.updatedAt));

  if (rows.length === 0) return false;

  // If we have a currentPeriodEnd, make sure it hasn't passed. Some rows may
  // not have it set (e.g. right after checkout before the invoice event
  // arrives) - in that case we trust the status field.
  return rows.some((row) => {
    if (!row.currentPeriodEnd) return true;
    return row.currentPeriodEnd.getTime() > now.getTime();
  });
}

export async function getLatestSubscription(userId: string) {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.updatedAt))
    .limit(1);
  return rows[0] ?? null;
}

export function isActiveStatus(status: string): boolean {
  return (ACTIVE_STATUSES as readonly string[]).includes(status);
}
