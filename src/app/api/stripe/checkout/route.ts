import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAppUrl } from "@/lib/url";
import { isTrialEligible, TRIAL_DAYS } from "@/lib/billing";
import { hasActiveSubscription } from "@/lib/subscription";
import { isApprovedMember } from "@/lib/member-status";
import { isFreeAccessMode } from "@/lib/access";
import { PREMIUM_ENABLED, type PlanKey } from "@/lib/plans";
import { basePlanFor, getPricing, priceIdOf } from "@/lib/pricing";

export async function POST(req: Request) {
  // tier: "basic"（その人の基本料金）または "premium"
  const body = (await req.json().catch(() => null)) as { tier?: string } | null;
  const premium = PREMIUM_ENABLED && body?.tier === "premium"; // プレミアム休止中は基本プランとして扱う

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  if (isFreeAccessMode()) {
    return NextResponse.json({ error: "現在は無料公開中のため、お申し込みは不要です" }, { status: 400 });
  }

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!dbUser) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  if (!(await isApprovedMember({ id: dbUser.id, email: dbUser.email }))) {
    return NextResponse.json(
      { error: "運営による会員登録の承認後にお申し込みいただけます" },
      { status: 403 },
    );
  }

  // 二重契約を防ぐ
  if (await hasActiveSubscription(dbUser.id)) {
    return NextResponse.json({ url: `${getAppUrl()}/dashboard` });
  }

  // 料金はサーバー側で決める：期間限定プランの受付中なら ¥980、終わったら 学割 → 通常
  const pricing = await getPricing();
  if (!premium && !pricing.founder.open && dbUser.student === "requested") {
    return NextResponse.json(
      { error: "学割の確認中です。運営の確認後にお申し込みいただけます" },
      { status: 403 },
    );
  }
  const plan: PlanKey = premium ? "premium" : basePlanFor(dbUser, pricing);
  const priceId = priceIdOf(plan, pricing);
  if (!priceId) {
    return NextResponse.json(
      { error: "料金プランの設定が完了していません。運営にお問い合わせください" },
      { status: 500 },
    );
  }

  const appUrl = getAppUrl();
  const trial = await isTrialEligible(dbUser.id);

  let customerId = dbUser.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: dbUser.email,
      name: dbUser.name ?? undefined,
      metadata: { userId: dbUser.id },
    });
    customerId = customer.id;
    await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, dbUser.id));
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    metadata: { userId: dbUser.id, plan },
    locale: "ja",
    subscription_data: {
      metadata: { userId: dbUser.id, plan },
      ...(trial
        ? {
            trial_period_days: TRIAL_DAYS,
            // カードが登録されていなければ、お試し終了時に自動で解約
            trial_settings: { end_behavior: { missing_payment_method: "cancel" as const } },
          }
        : {}),
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
