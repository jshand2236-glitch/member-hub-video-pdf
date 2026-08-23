import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import type { Session } from "next-auth";

/**
 * Use at the top of any Server Component that should only be visible to
 * logged-in members with an active subscription. Redirects to /login or
 * /pricing otherwise.
 */
export async function requireActiveSubscriber(callbackPath: string): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  const active = await hasActiveSubscription(session.user.id);
  if (!active) {
    redirect("/pricing");
  }

  return session;
}
