import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * 新規会員の無料お試し日数。0 = お試しなし（申し込み日から課金）。
 * 将来お試しを付けるときはここを 7 などにすれば、料金ページ・申し込み・
 * 特商法ページの表示がまとめて切り替わる。
 */
export const TRIAL_DAYS = 0;

/** 無料お試しの対象か（お試しあり かつ これまで一度も契約していない会員）。 */
export async function isTrialEligible(userId: string): Promise<boolean> {
  if (TRIAL_DAYS <= 0) return false;
  const prior = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return prior.length === 0;
}
