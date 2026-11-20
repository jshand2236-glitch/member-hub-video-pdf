import { countDistinct, eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings, subscriptions } from "@/db/schema";
import { PLANS, founderEndLabel, founderEndsAt, priceIdFor, type PlanKey } from "@/lib/plans";

/**
 * その時点の料金。
 * - 期間限定プラン（¥980）は、締め切り日（founderEndDate・既定 2027年12月31日）までに申し込んだ人。人数の上限なし。
 *   申し込んだ人は解約するまでずっと ¥980（Stripe の仕様）。
 * - 期間後の料金は、管理画面で選んだ Stripe の Price（site_settings に保存）。
 */
const STANDARD_KEY = "standardPrice";

export type Pricing = {
  founder: { amount: number; taken: number; open: boolean; endLabel: string; priceId?: string };
  standard: { amount: number; priceId?: string };
  student: { amount: number; priceId?: string };
  premium: { amount: number; priceId?: string };
};

export async function getStandardPrice(): Promise<{ amount: number; priceId?: string }> {
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, STANDARD_KEY)).limit(1);
  if (row) {
    try {
      const v = JSON.parse(row.value) as { priceId?: string; amount?: number };
      if (v.priceId && typeof v.amount === "number") return { priceId: v.priceId, amount: v.amount };
    } catch {
      /* 壊れていたら既定値 */
    }
  }
  return { amount: PLANS.standard.amount, priceId: priceIdFor("standard") };
}

export async function setStandardPrice(priceId: string, amount: number) {
  const value = JSON.stringify({ priceId, amount });
  await db
    .insert(siteSettings)
    .values({ key: STANDARD_KEY, value })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
}

/** ¥980 で申し込んだ人数（解約済みも含む・管理画面の表示用）。 */
export async function founderCount(): Promise<number> {
  const priceId = priceIdFor("founder");
  if (!priceId) return 0;
  const [row] = await db
    .select({ n: countDistinct(subscriptions.userId) })
    .from(subscriptions)
    .where(eq(subscriptions.stripePriceId, priceId));
  return row?.n ?? 0;
}

export async function getPricing(): Promise<Pricing> {
  const [taken, standard] = await Promise.all([founderCount(), getStandardPrice()]);
  const founderPriceId = priceIdFor("founder");
  return {
    // Price が未設定なら期間限定プランは出さない
    founder: {
      amount: PLANS.founder.amount,
      taken,
      open: !!founderPriceId && Date.now() < founderEndsAt().getTime(),
      endLabel: founderEndLabel(),
      priceId: founderPriceId,
    },
    standard,
    student: { amount: PLANS.student.amount, priceId: priceIdFor("student") },
    premium: { amount: PLANS.premium.amount, priceId: priceIdFor("premium") },
  };
}

/** 基本プラン（founder / student / standard）のうち、その人に当てはまるもの。 */
export function basePlanFor(user: { student: string | null } | null, pricing: Pricing): PlanKey {
  if (pricing.founder.open) return "founder"; // 期間中は誰でも ¥980（学割より安い）
  if (user?.student === "approved") return "student";
  return "standard";
}

export function amountOf(plan: PlanKey, pricing: Pricing): number {
  return pricing[plan].amount;
}

export function priceIdOf(plan: PlanKey, pricing: Pricing): string | undefined {
  return pricing[plan].priceId;
}
