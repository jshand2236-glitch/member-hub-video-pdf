import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { db } from "@/db";
import { pdfDocuments } from "@/db/schema";
import { BODY_PARTS } from "@/data/body-parts";
import { getPdfManifest, storedPdfKeyFromUrl } from "@/lib/pdf-storage";
import { updatePdfAction } from "../../actions";
import PdfReplaceForm from "./pdf-replace-form";

export const metadata = {
  title: "資料PDFの編集 | FMC",
};

const labelClass = "block text-sm font-medium";
const inputClass =
  "mt-1 w-full rounded-[4px] border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-accent";

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

export default async function EditPdfPage(props: PageProps<"/admin/pdfs/[id]">) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (!isAdminEmail(session.user.email)) redirect("/dashboard");

  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const saved = searchParams?.saved === "1";

  const [doc] = await db.select().from(pdfDocuments).where(eq(pdfDocuments.id, id)).limit(1);
  if (!doc) notFound();

  const key = storedPdfKeyFromUrl(doc.url);
  const manifest = key ? await getPdfManifest(key) : null;
  const diseases = [
    ...new Set(
      (await db.select({ disease: pdfDocuments.disease }).from(pdfDocuments))
        .map((r) => r.disease)
        .filter((d): d is string => !!d),
    ),
  ].sort();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <nav aria-label="パンくず" className="text-sm text-muted">
        <Link href="/admin#pdfs" className="hover:underline">
          管理画面
        </Link>
        <span className="mx-2">/</span>
        資料PDFの編集
      </nav>
      <h1 className="mt-4 font-serif text-2xl font-semibold">資料PDFの編集</h1>

      {saved && (
        <p role="status" className="mt-6 rounded-[4px] border border-accent/40 bg-soft px-4 py-3 text-sm">
          保存しました。
        </p>
      )}

      {/* Details */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">タイトル・説明など</h2>
        <form action={updatePdfAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={doc.id} />
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="title">
              タイトル
            </label>
            <input id="title" name="title" required maxLength={200} defaultValue={doc.title} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="description">
              説明（任意）
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={2000}
              defaultValue={doc.description ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="bodyPart">
              部位
            </label>
            <select id="bodyPart" name="bodyPart" defaultValue={doc.bodyPart ?? ""} className={inputClass}>
              <option value="">未分類</option>
              {BODY_PARTS.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="disease">
              疾患名
            </label>
            <input
              id="disease"
              name="disease"
              list="edit-pdf-diseases"
              maxLength={100}
              defaultValue={doc.disease ?? ""}
              className={inputClass}
            />
            <datalist id="edit-pdf-diseases">
              {diseases.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={labelClass} htmlFor="sortOrder">
              並び順（小さい順）
            </label>
            <input id="sortOrder" name="sortOrder" type="number" defaultValue={doc.sortOrder} className={inputClass} />
          </div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              className="rounded-[4px] bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              保存する
            </button>
            <Link href={`/pdfs/${doc.id}`} className="text-sm text-accent hover:underline">
              会員向けページで確認 →
            </Link>
          </div>
        </form>
      </section>

      {/* File */}
      <section className="mt-16 border-t border-line pt-10">
        <h2 className="text-lg font-semibold">PDFファイルの差し替え</h2>
        <p className="mt-2 text-sm text-muted">
          現在のファイル：
          {manifest ? (
            <>
              {manifest.filename}（{formatSize(manifest.size)}・
              {new Date(manifest.uploadedAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })} アップロード）
            </>
          ) : (
            doc.url
          )}
          {" "}
          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
            開く
          </a>
        </p>
        <PdfReplaceForm id={doc.id} />
      </section>
    </div>
  );
}
