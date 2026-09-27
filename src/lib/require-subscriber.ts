import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { isFreeAccessMode } from "@/lib/access";
import type { Session } from "next-auth";
import { isApprovedMember } from "@/lib/member-status";

/**
 * Use at the top of any Server Component that should only be visible to
 * logged-in members. Redirects to /login if not logged in, and to /pending
 * if the member has not been approved by the admin yet.
 *
 * When FREE_ACCESS_MODE is on (see src/lib/access.ts), any logged-in member
 * passes - no subscription required. Otherwise also requires an active
 * subscription, redirecting to /pricing if there isn't one.
 */
export async function requireActiveSubscriber(callbackPath: string): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  // Membership approval: new sign-ups wait on /pending until the admin
  // approves them.
  if (!(await isApprovedMember(session.user))) {
    redirect("/pending");
  }

  if (isFreeAccessMode()) {
    return session;
  }

  const active = await hasActiveSubscription(session.user.id);
  if (!active) {
    redirect("/pricing");
  }

  return session;
}
