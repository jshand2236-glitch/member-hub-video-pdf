import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { subscriptions, users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Stripe needs the raw request body to verify the webhook signature, so we
// must not let Next.js parse it as JSON first.
export const runtime = "nodejs";

async function upsertSubscriptionFromStripe(sub: Stripe.Subscription) {
  const userId = (sub.metadata?.userId as string | undefined) ?? undefined;

  let resolvedUserId = userId;
  if (!resolvedUserId) {
    // Fall back to looking the user up by Stripe customer id.
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId))
      .limit(1);
    resolvedUserId = dbUser?.id;
  }

  if (!resolvedUserId) {
    console.error("[stripe webhook] Could not resolve userId for subscription", sub.id);
    return;
  }

  const item = sub.items.data[0];
  const currentPeriodEndUnix = item?.current_period_end;

  const values = {
    userId: resolvedUserId,
    stripeSubscriptionId: sub.id,
    stripePriceId: item?.price?.id,
    status: sub.status,
    currentPeriodEnd: currentPeriodEndUnix ? new Date(currentPeriodEndUnix * 1000) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    updatedAt: new Date(),
  };

  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, sub.id))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(subscriptions)
      .set(values)
      .where(eq(subscriptions.stripeSubscriptionId, sub.id));
  } else {
    await db.insert(subscriptions).values(values);
  }
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("Missing stripe-signature header");
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] Signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertSubscriptionFromStripe(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscriptionFromStripe(sub);
        break;
      }
      default:
        // Ignore other event types.
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] Handler error", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
