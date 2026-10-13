import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { db } from "@/db";
import { videos, pdfDocuments, users } from "@/db/schema";
import { asc, desc } from "drizzle-orm";
import { MEMBER_STATUS_LABEL, isMemberStatus, type MemberStatus } from "@/lib/member-status";
import PdfUploadForm from "./pdf-upload-form";
import { BODY_PARTS } from "@/data/body-parts";
import { INSTRUCTORS } from "@/data/instructors";
import { addEventAction, addVideoAction, deleteEventAction, setMemberStatusAction } from "./actions";
import EventFields from "./event-fields";
import Link from "next/link";
import { formatEventDate, formatEventTime, getEventsForAdmin, type EventRow } from "@/lib/events";
import { PdfAdminList, VideoAdminList } from "./content-lists";
import SubmitButton from "@/components/submit-button";

export const metadata = {
  title: "管理画面 | FMC",
};

export default async function AdminPage(props: PageProps<"/admin">) {
  const searchParams = await props.searchParams;
  const videoError = searchParams?.videoError === "1";
  const eventError = searchParams?.eventError === "1";
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }
  if (!isAdminEmail(session.user.email)) {
    redirect("/dashboard");
  }

  const [allVideos, allPdfs, allMembers, eventLists] = await Promise.all([
    db.select().from(videos).orderBy(asc(videos.sortOrder), asc(videos.createdAt)),
    db.select().from(pdfDocuments).orderBy(asc(pdfDocuments.sortOrder), asc(pdfDocuments.createdAt)),
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
    getEventsForAdmin(),
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

      {/* 医療者交流会 */}
      <section id="events" className="mt-12 scroll-mt-24">
        <h2 className="text-lg font-semibold">医療者交流会の開催日</h2>
        <p className="mt-1 text-sm text-muted">登録した開催日は、会員のマイページに表示されます（終わった回は自動で表示されなくなります）。</p>
        {eventError && (
          <p role="alert" className="mt-3 rounded-[4px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            開催日と申し込みURL（https:// から始まるもの）を確認してください。
          </p>
        )}

        {eventLists.upcoming.length > 0 ? (
          <ul className="mt-4 divide-y divide-line rounded-[4px] border border-line">
            {eventLists.upcoming.map((e, i) => (
              <EventAdminRow key={e.id} event={e} badge={i === 0 ? "次回" : undefined} />
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">今後の開催予定はまだ登録されていません。</p>
        )}

        <details className="mt-6 rounded-[4px] border border-line p-4" open={eventLists.upcoming.length === 0}>
          <summary className="cursor-pointer text-sm font-medium text-accent">＋ 開催日を追加する</summary>
          <form action={addEventAction} className="mt-4 grid gap-4 sm:grid-cols-2">
            <EventFields />
            <div className="sm:col-span-2">
              <SubmitButton
                pendingLabel="追加中…"
                className="rounded-[4px] bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
              >
                開催日を追加
              </SubmitButton>
            </div>
          </form>
        </details>

        {eventLists.past.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted hover:text-accent">
              終了した回（直近{eventLists.past.length}件）
            </summary>
            <ul className="mt-2 divide-y divide-line">
              {eventLists.past.map((e) => (
                <EventAdminRow key={e.id} event={e} />
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* Videos */}
      <section id="videos" className="mt-12 scroll-mt-24">
        <h2 className="text-lg font-semibold">動画を追加</h2>
        {videoError && (
          <p role="alert" className="mt-3 rounded-[4px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            動画のURLまたは動画IDが読み取れませんでした。YouTubeのURL（例: https://youtu.be/YbklWBiOEbM）をそのまま貼り付けてください。
          </p>
        )}
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
            <label className={labelClass}>動画のURL または 動画ID</label>
            <input
              name="providerVideoId"
              required
              placeholder="例: https://youtu.be/YbklWBiOEbM"
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
            <SubmitButton
              pendingLabel="追加中…"
              className="rounded-[4px] bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              動画を追加
            </SubmitButton>
          </div>
        </form>

        <VideoAdminList videos={allVideos} />
      </section>

      {/* PDFs */}
      <section id="pdfs" className="mt-16 scroll-mt-24">
        <h2 className="text-lg font-semibold">PDF資料を追加</h2>
        <PdfUploadForm
          diseases={[...new Set(allPdfs.map((d) => d.disease).filter((d): d is string => !!d))].sort()}
        />

        <PdfAdminList docs={allPdfs} />
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
          <SubmitButton pendingLabel="処理中…" className={`rounded-[4px] px-3 py-1.5 text-xs ${a.className}`}>
            {a.label}
          </SubmitButton>
        </form>
      ))}
    </div>
  );
}

function EventAdminRow({ event, badge }: { event: EventRow; badge?: string }) {
  const time = formatEventTime(event);
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {formatEventDate(event.eventDate)}
          {badge && (
            <span className="ml-2 rounded-full bg-accent px-2 py-0.5 align-middle text-[11px] font-medium text-white">
              {badge}
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {[event.title, time, event.venue].filter(Boolean).join(" / ")}
        </p>
      </div>
      <Link
        href={`/admin/events/${event.id}`}
        className="rounded-[4px] border border-accent px-3 py-1 text-xs text-accent hover:bg-accent hover:text-white"
      >
        編集
      </Link>
      <form action={deleteEventAction}>
        <input type="hidden" name="id" value={event.id} />
        <SubmitButton
          pendingLabel="削除中…"
          confirmMessage={`${formatEventDate(event.eventDate)}の${event.title}を削除します。よろしいですか？`}
          className="text-xs text-red-600 hover:underline"
        >
          削除
        </SubmitButton>
      </form>
    </li>
  );
}
