import { NextResponse, type NextRequest } from "next/server";

// 以前の「交流会当日入会」の限定URL（QRコード）。当日入会プランは廃止したので、
// 配ったQRコードを読んだ人は、そのまま会員登録ページへ案内する。
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/register", req.nextUrl.origin));
}
