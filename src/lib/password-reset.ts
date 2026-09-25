import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

/**
 * Stateless password-reset tokens.
 *
 * A token is `<base64url(userId.expiresAt)>.<signature>`, where the signature
 * is an HMAC (keyed with AUTH_SECRET) over the user id, the expiry AND the
 * user's current password hash. That gives us, without any extra DB table:
 *  - tamper-proofing (you can't forge or edit a token without AUTH_SECRET)
 *  - expiry (RESET_TOKEN_TTL_MS)
 *  - single use: once the password is changed its hash changes, so every
 *    token issued before the change stops verifying.
 */

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function sign(userId: string, expiresAt: number, passwordHash: string): string {
  return createHmac("sha256", secret())
    .update(`${userId}.${expiresAt}.${passwordHash}`)
    .digest("base64url");
}

export function createResetToken(user: { id: string; passwordHash: string }): string {
  const expiresAt = Date.now() + RESET_TOKEN_TTL_MS;
  const payload = Buffer.from(`${user.id}.${expiresAt}`).toString("base64url");
  return `${payload}.${sign(user.id, expiresAt, user.passwordHash)}`;
}

/** Returns the user the token belongs to, or null if it is invalid/expired/used. */
export async function verifyResetToken(token: string) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  let userId: string;
  let expiresAt: number;
  try {
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const dot = decoded.lastIndexOf(".");
    userId = decoded.slice(0, dot);
    expiresAt = Number(decoded.slice(dot + 1));
  } catch {
    return null;
  }
  if (!userId || !Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const expected = Buffer.from(sign(user.id, expiresAt, user.passwordHash));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  return user;
}
