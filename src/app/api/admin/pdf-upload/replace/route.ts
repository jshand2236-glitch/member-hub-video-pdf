import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { db } from "@/db";
import { pdfDocuments } from "@/db/schema";
import { deletePdf, finalizePdf, PDF_KEY_PATTERN, PDF_MAX_PARTS, storedPdfKeyFromUrl } from "@/lib/pdf-storage";

const bodySchema = z.object({
  id: z.string().min(1).max(100),
  key: z.string().regex(PDF_KEY_PATTERN),
  parts: z.number().int().min(1).max(PDF_MAX_PARTS),
  size: z.number().int().positive(),
  filename: z.string().min(1).max(200),
});

// Swaps the file behind an existing PDF document for a newly uploaded one
// (uploaded in chunks first, exactly like a new PDF). Title, category and the
// /pdfs/<id> page stay the same; the old file is deleted from storage.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "管理者権限がありません" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容が正しくありません" }, { status: 400 });
  }
  const { id, key, parts, size, filename } = parsed.data;

  const [doc] = await db.select().from(pdfDocuments).where(eq(pdfDocuments.id, id)).limit(1);
  if (!doc) {
    return NextResponse.json({ error: "資料が見つかりません" }, { status: 404 });
  }

  const ok = await finalizePdf(key, { parts, size, filename });
  if (!ok) {
    return NextResponse.json({ error: "アップロードが完了していません。もう一度お試しください。" }, { status: 400 });
  }

  await db.update(pdfDocuments).set({ url: `/api/pdfs/${key}` }).where(eq(pdfDocuments.id, id));

  // Remove the previous file only after the document points at the new one.
  const oldKey = storedPdfKeyFromUrl(doc.url);
  if (oldKey && oldKey !== key) await deletePdf(oldKey);

  revalidatePath("/admin");
  revalidatePath(`/admin/pdfs/${id}`);
  revalidatePath("/pdfs");
  revalidatePath(`/pdfs/${id}`);
  return NextResponse.json({ ok: true });
}
