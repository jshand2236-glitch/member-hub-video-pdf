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

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  if (isFreeAccessMode()) {
    return NextResponse.json({ error: "現在は無料公開中のため、お申し込みは不要です" }, { status: 400 });
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return NextResponse.json(
      { error: "STRIPE_PRICE_ID が設定されていません" },
      { status: 500 },
    );
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
    metadata: { userId: dbUser.id },
    locale: "ja",
    subscription_data: {
      metadata: { userId: dbUser.id },
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
