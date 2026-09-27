import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isAdminEmail } from "@/lib/admin";

export const MEMBER_STATUSES = ["pending", "approved", "rejected", "suspended"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  pending: "承認待ち",
  approved: "承認済み",
  rejected: "否認",
  suspended: "利用停止",
};

export function isMemberStatus(v: string): v is MemberStatus {
  return (MEMBER_STATUSES as readonly string[]).includes(v);
}

/**
 * Looked up from the database on every request (not stored in the session
 * JWT) so approving or suspending a member takes effect immediately.
 */
export async function getMemberStatus(userId: string): Promise<MemberStatus | null> {
  const [row] = await db
    .select({ status: users.status })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) return null;
  return isMemberStatus(row.status) ? row.status : "pending";
}

/** Admins always pass; everyone else must be approved. */
export async function isApprovedMember(user: { id: string; email?: string | null }) {
  if (isAdminEmail(user.email)) return true;
  return (await getMemberStatus(user.id)) === "approved";
}
