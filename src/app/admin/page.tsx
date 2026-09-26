import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { db } from "@/db";
import { videos, pdfDocuments } from "@/db/schema";
import { asc } from "drizzle-orm";
import PdfUploadForm from "./pdf-upload-form";
import { BODY_PARTS, findBodyPart } from "@/data/body-parts";
import { INSTRUCTORS } from "@/data/instructors";
import {
  addVideoAction,
  updateVideoBodyPartAction,
  deletePdfAction,
  updatePdfMetaAction,
  deleteVideoAction,
} from "./actions";

export const metadata = {
  title: "管理画面 | AAM Fukuoka",
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }
  if (!isAdminEmail(session.user.email)) {
    redirect("/dashboard");
  }

  const [allVideos, allPdfs] = await Promise.all([
    db.select().from(videos).orderBy(asc(videos.sortOrder)),
    db.select().from(pdfDocuments).orderBy(asc(pdfDocuments.sortOrder)),
  ]);

  const inputClass =
    "mt-1 w-full rounded-[4px] border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-accent";
  const labelClass = "block text-sm font-medium";

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="font-serif text-2xl font-semibold">管理画面</h1>
      <p className="mt-1 text-sm text-muted">
        動画・PDF資料の追加/削除ができます（管理者のみ）。
      </p>

      {/* Videos */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold">動画を追加</h2>
        <form action={addVideoAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>タイトル</label>
            <input name="title" required className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>説明（任意）</label>
            <textarea name="description" rows={2} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>部位</label>
            <select name="bodyPart" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                選択してください
              </option>
              {BODY_PARTS.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>講師名</label>
            <input
              name="instructorName"
              list="instructor-names"
              placeholder="例: 安良田 卓也"
              className={inputClass}
            />
            <datalist id="instructor-names">
              {INSTRUCTORS.map((i) => (
                <option key={i.slug} value={i.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={labelClass}>配信元</label>
            <select name="provider" className={inputClass} defaultValue="youtube">
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>並び順（小さい順）</label>
            <input name="sortOrder" type="number" defaultValue={0} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>動画ID</label>
            <input
              name="providerVideoId"
              required
              placeholder="例: dQw4w9WgXcQ"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              Vimeoの限定公開ハッシュ（hパラメータ・任意）
            </label>
            <input name="embedHash" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-[4px] bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              動画を追加
            </button>
          </div>
        </form>

        <ul className="mt-8 divide-y divide-line">
          {allVideos.map((video) => (
            <li key={video.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{video.title}</p>
                <p className="text-xs text-muted">
                  {findBodyPart(video.bodyPart)?.label ?? "未分類"}
                  {video.instructorName ? ` / ${video.instructorName}` : ""}
                  {` / ${video.provider} / ${video.providerVideoId}`}
                </p>
              </div>
              <form action={updateVideoBodyPartAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={video.id} />
                <select
                  name="bodyPart"
                  defaultValue={video.bodyPart ?? ""}
                  aria-label="部位"
                  className="rounded-[4px] border border-line bg-transparent px-2 py-1 text-xs outline-none focus:border-accent"
                >
                  <option value="">未分類</option>
                  {BODY_PARTS.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <button type="submit" className="text-xs text-accent hover:underline">
                  部位を変更
                </button>
              </form>
              <form action={deleteVideoAction}>
                <input type="hidden" name="id" value={video.id} />
                <button
                  type="submit"
                  className="text-sm text-red-600 hover:underline"
                >
                  削除
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      {/* PDFs */}
      <section className="mt-16">
        <h2 className="text-lg font-semibold">PDF資料を追加</h2>
        <PdfUploadForm
          diseases={[...new Set(allPdfs.map((d) => d.disease).filter((d): d is string => !!d))].sort()}
        />

        <ul className="mt-8 divide-y divide-line">
          {allPdfs.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{doc.title}</p>
                <p className="text-xs text-muted">
                  {findBodyPart(doc.bodyPart)?.label ?? "未分類"}
                  {doc.disease ? ` / ${doc.disease}` : ""}
                  {doc.url.startsWith("/api/pdfs/") ? "" : ` / ${doc.url}`}
                </p>
              </div>
              <form action={updatePdfMetaAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={doc.id} />
                <select
                  name="bodyPart"
                  defaultValue={doc.bodyPart ?? ""}
                  aria-label="部位"
                  className="rounded-[4px] border border-line bg-transparent px-2 py-1 text-xs outline-none focus:border-accent"
                >
                  <option value="">未分類</option>
                  {BODY_PARTS.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <input
                  name="disease"
                  defaultValue={doc.disease ?? ""}
                  list="pdf-diseases"
                  placeholder="疾患名"
                  aria-label="疾患名"
                  className="w-40 rounded-[4px] border border-line bg-transparent px-2 py-1 text-xs outline-none focus:border-accent"
                />
                <button type="submit" className="text-xs text-accent hover:underline">
                  変更
                </button>
              </form>
              <form action={deletePdfAction}>
                <input type="hidden" name="id" value={doc.id} />
                <button
                  type="submit"
                  className="text-sm text-red-600 hover:underline"
                >
                  削除
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
