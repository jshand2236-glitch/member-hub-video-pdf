import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { BODY_PARTS } from "@/data/body-parts";
import { INSTRUCTORS } from "@/data/instructors";
import { updateVideoAction } from "../../actions";

export const metadata = {
  title: "動画の編集 | FMC",
};

const labelClass = "block text-sm font-medium";
const inputClass =
  "mt-1 w-full rounded-[4px] border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-accent";

export default async function EditVideoPage(props: PageProps<"/admin/videos/[id]">) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (!isAdminEmail(session.user.email)) redirect("/dashboard");

  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const saved = searchParams?.saved === "1";
  const error = searchParams?.error === "1";

  const [video] = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  if (!video) notFound();

  const thumb =
    video.thumbnailUrl ??
    (video.provider === "youtube" ? `https://img.youtube.com/vi/${video.providerVideoId}/hqdefault.jpg` : null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <nav aria-label="パンくず" className="text-sm text-muted">
        <Link href="/admin#videos" className="hover:underline">
          管理画面
        </Link>
        <span className="mx-2">/</span>
        動画の編集
      </nav>
      <h1 className="mt-4 font-serif text-2xl font-semibold">動画の編集</h1>

      {saved && (
        <p role="status" className="mt-6 rounded-[4px] border border-accent/40 bg-soft px-4 py-3 text-sm">
          保存しました。
        </p>
      )}

      {error && (
        <p role="alert" className="mt-6 rounded-[4px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          動画のURLまたは動画IDが読み取れませんでした。YouTubeのURL（例: https://youtu.be/YbklWBiOEbM）をそのまま貼り付けてください。
        </p>
      )}

      {thumb && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" className="mt-8 aspect-video w-full max-w-sm rounded-[4px] object-cover" />
      )}

      <form action={updateVideoAction} className="mt-8 grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="id" value={video.id} />
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="title">
            タイトル
          </label>
          <input id="title" name="title" required maxLength={200} defaultValue={video.title} className={inputClass} />
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
            defaultValue={video.description ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="bodyPart">
            部位
          </label>
          <select id="bodyPart" name="bodyPart" defaultValue={video.bodyPart ?? ""} className={inputClass}>
            <option value="">未分類</option>
            {BODY_PARTS.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="instructorName">
            講師名
          </label>
          <input
            id="instructorName"
            name="instructorName"
            list="edit-instructor-names"
            maxLength={100}
            defaultValue={video.instructorName ?? ""}
            className={inputClass}
          />
          <datalist id="edit-instructor-names">
            {INSTRUCTORS.map((i) => (
              <option key={i.slug} value={i.name} />
            ))}
          </datalist>
        </div>
        <div>
          <label className={labelClass} htmlFor="provider">
            配信元
          </label>
          <select id="provider" name="provider" defaultValue={video.provider} className={inputClass}>
            <option value="youtube">YouTube</option>
            <option value="vimeo">Vimeo</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="sortOrder">
            並び順（小さい順）
          </label>
          <input id="sortOrder" name="sortOrder" type="number" defaultValue={video.sortOrder} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="providerVideoId">
            動画のURL または 動画ID
          </label>
          <input
            id="providerVideoId"
            name="providerVideoId"
            required
            defaultValue={video.providerVideoId}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted">
            別の動画に差し替えるときは、YouTubeのURL（例: https://youtu.be/YbklWBiOEbM）をそのまま貼り付けてください。
          </p>
        </div>
        {video.provider === "vimeo" && (
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="embedHash">
              Vimeoの限定公開ハッシュ（hパラメータ・任意）
            </label>
            <input id="embedHash" name="embedHash" defaultValue={video.embedHash ?? ""} className={inputClass} />
          </div>
        )}
        <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            className="rounded-[4px] bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            保存する
          </button>
          <Link href={`/videos/${video.id}`} className="text-sm text-accent hover:underline">
            会員向けページで確認 →
          </Link>
        </div>
      </form>
    </div>
  );
}
