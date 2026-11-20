import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { isAdminEmail } from "@/lib/admin";
import { PREMIUM_ENABLED, priceIdFor } from "@/lib/plans";
import { isStaffOrAdmin } from "@/lib/subscription";

/** プレミアムプランで契約中か（管理者は常に true）。 */
export async function hasPremiumAccess(user: { id: string; email?: string | null }): Promise<boolean> {
  if (isAdminEmail(user.email) || (await isStaffOrAdmin(user.id))) return true;
  const premiumPrice = priceIdFor("premium");
  if (!premiumPrice) return false;
  const [row] = await db
    .select({ priceId: subscriptions.stripePriceId, end: subscriptions.currentPeriodEnd })
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, user.id), inArray(subscriptions.status, ["active", "trialing"])))
    .orderBy(desc(subscriptions.updatedAt))
    .limit(1);
  if (!row || row.priceId !== premiumPrice) return false;
  return !row.end || row.end.getTime() > Date.now();
}

/** プレミアム限定で、この人には鍵がかかる動画か（無料公開が優先）。 */
export function isPremiumLocked(video: { premiumOnly: boolean; isFree: boolean }, premium: boolean): boolean {
  if (!PREMIUM_ENABLED) return false; // プレミアム休止中は「プレミアム限定」の鍵をかけない
  return video.premiumOnly && !video.isFree && !premium;
}
