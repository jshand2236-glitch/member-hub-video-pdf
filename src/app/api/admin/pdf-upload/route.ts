import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { PDF_CHUNK_SIZE, PDF_KEY_PATTERN, PDF_MAX_PARTS, savePdfPart } from "@/lib/pdf-storage";

// Receives one chunk of a PDF being uploaded from /admin.
// POST /api/admin/pdf-upload?key=<uuid>&part=<n>   body: raw bytes
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "管理者権限がありません" }, { status: 403 });
  }

  const key = req.nextUrl.searchParams.get("key") ?? "";
  const part = Number(req.nextUrl.searchParams.get("part"));
  if (!PDF_KEY_PATTERN.test(key) || !Number.isInteger(part) || part < 0 || part >= PDF_MAX_PARTS) {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const data = await req.arrayBuffer();
  if (data.byteLength === 0 || data.byteLength > PDF_CHUNK_SIZE) {
    return NextResponse.json({ error: "チャンクのサイズが不正です" }, { status: 400 });
  }
  if (part === 0) {
    const head = new TextDecoder().decode(new Uint8Array(data, 0, Math.min(5, data.byteLength)));
    if (head !== "%PDF-") {
      return NextResponse.json({ error: "PDFファイルではありません" }, { status: 400 });
    }
  }

  await savePdfPart(key, part, data);
  return NextResponse.json({ ok: true });
}
