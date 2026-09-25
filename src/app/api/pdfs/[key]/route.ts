import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { isFreeAccessMode } from "@/lib/access";
import { hasActiveSubscription } from "@/lib/subscription";
import { getPdfManifest, PDF_KEY_PATTERN, streamPdf } from "@/lib/pdf-storage";

// Member-only PDF download/viewer endpoint. Same access rule as /pdfs.
export async function GET(req: NextRequest, ctx: RouteContext<"/api/pdfs/[key]">) {
  const { key } = await ctx.params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login?callbackUrl=/pdfs", req.nextUrl.origin));
  }
  if (!isFreeAccessMode() && !(await hasActiveSubscription(session.user.id))) {
    return new NextResponse("会員登録（有料プラン）が必要です", { status: 403 });
  }

  if (!PDF_KEY_PATTERN.test(key)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const manifest = await getPdfManifest(key);
  if (!manifest) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(streamPdf(key, manifest), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(manifest.size),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(manifest.filename)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
