import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authConfig } from "@/auth.config";
import { LIMITS, clearBucket, clientIp, consume, isLimited, recordEvent } from "@/lib/rate-limit";

/** Thrown when an email or IP has made too many login attempts. */
export class TooManyAttempts extends CredentialsSignin {
  code = "too_many_attempts";
}

// Full Auth.js config, including the Credentials provider (which needs
// bcrypt + the Postgres client). Only import this from Route Handlers,
// Server Actions, and Server Components (all Node.js runtime). Proxy.ts
// uses the edge-safe `authConfig` directly instead - see auth.config.ts.
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, request) => {
        const rawEmail = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!rawEmail || !password) return null;
        const email = rawEmail.toLowerCase().trim();

        // Brute-force protection: cap failed attempts per account and all
        // attempts per IP.
        const failBucket = `login-fail:email:${email}`;
        if (await isLimited(failBucket, LIMITS.loginFailPerEmail)) throw new TooManyAttempts();
        const ip = clientIp(request?.headers ?? new Headers());
        if (!(await consume(`login:ip:${ip}`, LIMITS.loginPerIp))) throw new TooManyAttempts();

        const rows = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        const user = rows[0];
        if (!user) {
          await recordEvent(failBucket);
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          await recordEvent(failBucket);
          return null;
        }
        await clearBucket(failBucket);

        return {
          id: user.id,
          name: user.name ?? undefined,
          email: user.email,
        };
      },
    }),
  ],
});
