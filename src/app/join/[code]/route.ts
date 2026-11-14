import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { EARLY_OFFER, earlyJoinCode } from "@/lib/plans";
import { OFFER_COOKIE } from "@/lib/offer";

// 交流会当日入会の限定URL（QRコード）。開いた人は ¥2,980 の当日入会プランで申し込める。
//  - 未ログイン：ブラウザに印を残して会員登録へ（登録時に会員情報へ保存）
//  - ログイン中：その場で会員情報に保存して料金ページへ
export async function GET(req: NextRequest, ctx: RouteContext<"/join/[code]">) {
  const { code } = await ctx.params;
  const valid = earlyJoinCode();
  if (!valid || code !== valid) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  const session = await auth();
  let res: NextResponse;
  if (session?.user?.id) {
    await db.update(users).set({ offer: EARLY_OFFER }).where(eq(users.id, session.user.id));
    res = NextResponse.redirect(new URL("/pricing", req.nextUrl.origin));
  } else {
    res = NextResponse.redirect(new URL("/register", req.nextUrl.origin));
  }
  res.cookies.set(OFFER_COOKIE, valid, {
    httpOnly: true,
    sameSite: "lax",
    secure: req.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
