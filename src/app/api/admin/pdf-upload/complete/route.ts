import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { db } from "@/db";
import { pdfDocuments } from "@/db/schema";
import { finalizePdf, PDF_KEY_PATTERN, PDF_MAX_PARTS } from "@/lib/pdf-storage";
import { isBodyPartSlug } from "@/data/body-parts";

const bodySchema = z.object({
  key: z.string().regex(PDF_KEY_PATTERN),
  parts: z.number().int().min(1).max(PDF_MAX_PARTS),
  size: z.number().int().positive(),
  filename: z.string().min(1).max(200),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  bodyPart: z.string().optional(),
  disease: z.string().trim().max(100).optional(),
  sortOrder: z.number().int().optional(),
});

// Called once every chunk has been uploaded: makes the file servable and
// adds it to the member PDF list.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "管理者権限がありません" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容が正しくありません" }, { status: 400 });
  }
  const { key, parts, size, filename, title, description, bodyPart, disease, sortOrder } = parsed.data;

  const ok = await finalizePdf(key, { parts, size, filename });
  if (!ok) {
    return NextResponse.json({ error: "アップロードが完了していません。もう一度お試しください。" }, { status: 400 });
  }

  await db.insert(pdfDocuments).values({
    title,
    description: description || null,
    url: `/api/pdfs/${key}`,
    bodyPart: bodyPart && isBodyPartSlug(bodyPart) ? bodyPart : null,
    disease: disease || null,
    sortOrder: sortOrder ?? 0,
  });

  revalidatePath("/admin");
  revalidatePath("/pdfs");
  return NextResponse.json({ ok: true });
}
