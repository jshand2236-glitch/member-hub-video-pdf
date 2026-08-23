import { NextResponse } from "next/server";
import { auth } from "@/auth";

// This Proxy (formerly "middleware") only checks whether the user is signed
// in (via the session cookie/JWT). Whether the signed-in user has an
// *active subscription* is checked separately inside each protected
// page/server component, right next to the data it needs to look at.
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
