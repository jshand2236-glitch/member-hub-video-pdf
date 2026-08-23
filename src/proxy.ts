import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// This Proxy (formerly "middleware") only checks whether the user is signed
// in (via the session cookie/JWT). Whether the signed-in user has an
// *active subscription* is checked separately inside each protected
// page/server component, right next to the data it needs to look at.
//
// It builds its own NextAuth instance from the edge-safe `authConfig`
// (no providers) rather than importing `auth` from "@/auth" - that full
// config's Credentials provider pulls in bcrypt and the Postgres client,
// neither of which can load in Netlify's Edge Functions runtime that
// Proxy/Middleware is deployed as.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const { pathname } = req.nextUrl;

  const protectedPaths = ["/dashboard", "/videos", "/pdfs", "/admin"];
  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/videos/:path*", "/pdfs/:path*", "/admin/:path*"],
};
