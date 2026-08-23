import type { NextAuthConfig } from "next-auth";

// Edge-safe subset of the Auth.js config.
//
// The Credentials provider's `authorize()` needs bcrypt and the Postgres
// client (see auth.ts), and Postgres's Node sockets/TLS can't run in
// Netlify's Edge Functions runtime, which is what Next.js Proxy/Middleware
// (src/proxy.ts) is deployed as on Netlify. So this file intentionally
// has NO providers - it's used directly by proxy.ts (just to check whether
// a session JWT is present) and is spread into the full config in auth.ts
// (used by Route Handlers/Server Actions/Server Components, which all run
// in the Node.js runtime and can safely import the DB client).
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;
