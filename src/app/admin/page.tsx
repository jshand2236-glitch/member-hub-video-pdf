import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { db } from "@/db";
import { videos, pdfDocuments, users } from "@/db/schema";
import { asc, desc } from "drizzle-orm";
import { MEMBER_STATUS_LABEL, isMemberStatus, type MemberStatus } from "@/lib/member-status";
import PdfUploadForm from "./pdf-upload-form";
import { BODY_PARTS, findBodyPart } from "@/data/body-parts";
import { INSTRUCTORS } from "@/data/instructors";
import {
  addVideoAction,
  updateVideoBodyPartAction,
  deletePdfAction,
  updatePdfMetaAction,
  deleteVideoAction,
  setMemberStatusAction,
} from "./actions";

export const metadata = {
  title: "管理画面 | FMC",
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }
  if (!isAdminEmail(session.user.email)) {
    redirect("/dashboard");
  }

  const [allVideos, allPdfs, allMembers] = await Promise.all([
    db.select().from(videos).orderBy(asc(videos.sortOrder)),
    db.select().from(pdfDocuments).orderBy(asc(pdfDocuments.sortOrder)),
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt)),
  ]);
  const statusOf = (s: string): MemberStatus => (isMemberStatus(s) ? s : "pending");
  const pendingMembers = allMembers.filter((m) => statusOf(m.status) === "pending");
  const otherMembers = allMembers.filter((m) => statusOf(m.status) !== "pending");

  const inputClass =
    "mt-1 w-full rounded-[4px] border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-accent";
  const labelClass = "block text-sm font-medium";

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="font-serif text-2xl font-semibold">管理画面</h1>
      <p className="mt-1 text-sm text-muted">
        会員の承認と、動画・PDF資料の追加/削除ができます（管理者のみ）。
      </p>

      {/* Members */}
      <section id="members" className="mt-12 scroll-mt-24">
        <h2 className="text-lg font-semibold">
          会員の承認
          {pendingMembers.length > 0 && (
            <span className="ml-2 rounded-full bg-accent px-2 py-0.5 align-middle text-xs font-medium text-white">
              承認待ち {pendingMembers.length}件
            </span>
          )}
        </h2>
        {pendingMembers.length === 0 ? (
          <p className="mt-3 text-sm text-muted">承認待ちの会員はいません。</p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-[4px] border border-accent/40 bg-soft">
            {pendingMembers.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{m.name || "（氏名未入力）"}</p>
                  <p className="text-xs text-muted">
                    {m.email} / 登録日 {m.createdAt.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                  </p>
                </div>
                <MemberButtons id={m.id} current="pending" />
              </li>
            ))}
          </ul>
        )}

        {otherMembers.length > 0 && (
          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-muted hover:text-accent">
              登録済みの会員一覧（{otherMembers.length}名）
            </summary>
            <ul className="mt-3 divide-y divide-line">
              {otherMembers.map((m) => {
                const st = statusOf(m.status);
                return (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {m.name || "（氏名未入力）"}
                        <span
                          className={`ml-2 rounded-[3px] px-1.5 py-0.5 text-[11px] ${
                            st === "approved" ? "bg-soft text-muted" : "bg-red-50 text-red-700"
                          }`}
                        >
                          {MEMBER_STATUS_LABEL[st]}
                        </span>
                      </p>
                      <p className="text-xs text-muted">
                        {m.email} / 登録日 {m.createdAt.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                      </p>
                    </div>
                    <MemberButtons id={m.id} current={st} />
                  </li>
                );
              })}
            </ul>
          </details>
        )}
      </section>

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
      <section id="pdfs" className="mt-16 scroll-mt-24">
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
              <Link
                href={`/admin/pdfs/${doc.id}`}
                className="rounded-[4px] border border-accent px-3 py-1 text-xs text-accent hover:bg-accent hover:text-white"
              >
                編集・差し替え
              </Link>
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

function MemberButtons({ id, current }: { id: string; current: MemberStatus }) {
  const actions: { status: MemberStatus; label: string; className: string }[] = [];
  if (current !== "approved") {
    actions.push({
      status: "approved",
      label: current === "pending" ? "承認" : "承認に戻す",
      className: "bg-accent text-white hover:bg-accent-hover",
    });
  }
  if (current === "pending") {
    actions.push({
      status: "rejected",
      label: "否認",
      className: "border border-line text-muted hover:border-red-600 hover:text-red-600",
    });
  }
  if (current === "approved") {
    actions.push({
      status: "suspended",
      label: "利用停止",
      className: "border border-line text-muted hover:border-red-600 hover:text-red-600",
    });
  }
  return (
    <div className="flex gap-2">
      {actions.map((a) => (
        <form key={a.status} action={setMemberStatusAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={a.status} />
          <button type="submit" className={`rounded-[4px] px-3 py-1.5 text-xs ${a.className}`}>
            {a.label}
          </button>
        </form>
      ))}
    </div>
  );
}
