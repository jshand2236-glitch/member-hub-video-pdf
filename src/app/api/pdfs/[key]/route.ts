import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { isFreeAccessMode } from "@/lib/access";
import { hasActiveSubscription } from "@/lib/subscription";
import { isApprovedMember } from "@/lib/member-status";
import { getPdfManifest, PDF_KEY_PATTERN, streamPdf } from "@/lib/pdf-storage";
import { db } from "@/db";
import { pdfDocuments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdminEmail } from "@/lib/admin";
import { isPublished } from "@/lib/publish";

// Member-only PDF download/viewer endpoint. Same access rule as /pdfs.
export async function GET(req: NextRequest, ctx: RouteContext<"/api/pdfs/[key]">) {
  const { key } = await ctx.params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login?callbackUrl=/pdfs", req.nextUrl.origin));
  }
  if (!(await isApprovedMember(session.user))) {
    return new NextResponse("運営による会員承認が必要です", { status: 403 });
  }
  if (!isFreeAccessMode() && !(await hasActiveSubscription(session.user.id))) {
    return new NextResponse("会員登録（有料プラン）が必要です", { status: 403 });
  }

  if (!PDF_KEY_PATTERN.test(key)) {
    return new NextResponse("Not found", { status: 404 });
  }
  // 予約配信中の資料は公開日時まで管理者以外には返さない
  const [doc] = await db
    .select({ publishAt: pdfDocuments.publishAt })
    .from(pdfDocuments)
    .where(eq(pdfDocuments.url, `/api/pdfs/${key}`))
    .limit(1);
  if (doc && !isPublished(doc.publishAt) && !isAdminEmail(session.user.email)) {
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
