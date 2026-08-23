import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { db } from "@/db";
import { videos, pdfDocuments } from "@/db/schema";
import { asc } from "drizzle-orm";
import {
  addPdfAction,
  addVideoAction,
  deletePdfAction,
  deleteVideoAction,
} from "./actions";

export const metadata = {
  title: "管理画面 | Member Hub",
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
    "mt-1 w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40";
  const labelClass = "block text-sm font-medium";

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold">管理画面</h1>
      <p className="mt-1 text-sm text-foreground/60">
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
          <div className="sm:col-span-2">
            <label className={labelClass}>講師名（任意）</label>
            <input name="instructorName" placeholder="例: 山田 太郎" className={inputClass} />
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
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              動画を追加
            </button>
          </div>
        </form>

        <ul className="mt-8 divide-y divide-foreground/10">
          {allVideos.map((video) => (
            <li key={video.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{video.title}</p>
                <p className="text-xs text-foreground/50">
                  {video.instructorName ? `${video.instructorName} / ` : ""}
                  {video.provider} / {video.providerVideoId}
                </p>
              </div>
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
        <form action={addPdfAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>タイトル</label>
            <input name="title" required className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>説明（任意）</label>
            <textarea name="description" rows={2} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>
              PDFのURL（/public 配下のパス、または外部URL）
            </label>
            <input name="url" required placeholder="/pdfs/sample.pdf" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>並び順（小さい順）</label>
            <input name="sortOrder" type="number" defaultValue={0} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              PDFを追加
            </button>
          </div>
        </form>

        <ul className="mt-8 divide-y divide-foreground/10">
          {allPdfs.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{doc.title}</p>
                <p className="text-xs text-foreground/50">{doc.url}</p>
              </div>
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
