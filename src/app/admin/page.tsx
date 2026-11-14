import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { db } from "@/db";
import { videos, pdfDocuments, users, subscriptions } from "@/db/schema";
import { asc, desc } from "drizzle-orm";
import { MEMBER_STATUS_LABEL, isMemberStatus, type MemberStatus } from "@/lib/member-status";
import PdfUploadForm from "./pdf-upload-form";
import { BODY_PARTS } from "@/data/body-parts";
import { INSTRUCTORS } from "@/data/instructors";
import { addEventAction, addVideoAction, deleteEventAction, movePartAction, setMemberStatusAction, setOfferAction, setStaffAction, setStudentAction } from "./actions";
import { SEMINAR_SLUG, categoryLabel, getPartOrder } from "@/lib/part-order";
import EventFields from "./event-fields";
import Link from "next/link";
import { formatEventDate, formatEventTime, getAllEventsNewestFirst, getEventsForAdmin, type EventRow } from "@/lib/events";
import EventPicker from "./event-picker";
import PublishAtField from "./publish-at-field";
import UnlockWeekField from "./unlock-week-field";
import FreeField from "./free-field";
import PremiumField from "./premium-field";
import { getAppUrl } from "@/lib/url";
import { PdfAdminList, VideoAdminList } from "./content-lists";
import SubmitButton from "@/components/submit-button";
import { PLANS, earlyJoinCode, priceIdFor, yen, type PlanKey } from "@/lib/plans";

export const metadata = {
  title: "管理画面 | FMC",
};

export default async function AdminPage(props: PageProps<"/admin">) {
  const searchParams = await props.searchParams;
  const videoError = searchParams?.videoError === "1";
  const eventError = searchParams?.eventError === "1";
  const studentError = searchParams?.studentError === "1";
  const subFilter = typeof searchParams?.sub === "string" ? searchParams.sub : "";
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }
  if (!isAdminEmail(session.user.email)) {
    redirect("/dashboard");
  }

  const [allVideos, allPdfs, allMembers, eventLists, allEvents, partOrder, allSubs] = await Promise.all([
    db.select().from(videos).orderBy(asc(videos.sortOrder), asc(videos.createdAt)),
    db.select().from(pdfDocuments).orderBy(asc(pdfDocuments.sortOrder), asc(pdfDocuments.createdAt)),
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        student: users.student,
        offer: users.offer,
        staff: users.staff,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt)),
    getEventsForAdmin(),
    getAllEventsNewestFirst(),
    getPartOrder(),
    db
      .select({
        userId: subscriptions.userId,
        status: subscriptions.status,
        stripePriceId: subscriptions.stripePriceId,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      })
      .from(subscriptions)
      .orderBy(desc(subscriptions.updatedAt)),
  ]);
  // 会員ごとの最新の契約（Stripe の Webhook で自動更新される）
  const subOf = new Map<string, SubInfo>();
  for (const s of allSubs) if (!subOf.has(s.userId)) subOf.set(s.userId, s);
  const subCounts: Record<SubKind, number> = { active: 0, canceling: 0, trouble: 0, ended: 0, none: 0 };
  for (const m of allMembers) subCounts[subKind(subOf.get(m.id))]++;
  const statusOf = (s: string): MemberStatus => (isMemberStatus(s) ? s : "pending");
  const pendingMembers = allMembers.filter((m) => statusOf(m.status) === "pending");
  const otherMembers = allMembers
    .filter((m) => statusOf(m.status) !== "pending")
    .filter((m) => !subFilter || subKind(subOf.get(m.id)) === subFilter);

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
        {studentError && (
          <p role="alert" className="mt-3 rounded-[4px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            学割の設定は保存しましたが、Stripe側の料金の切り替えに失敗しました。Stripeの料金ID（環境変数）を確認してください。
          </p>
        )}
        <p className="mt-1 text-xs text-muted">
          学割を承認すると月額 ¥1,980 で申し込めます。契約中の人の学割を外す（卒業など）と、次回更新分から ¥3,980 に切り替わります。
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted">契約状況：</span>
          {(Object.keys(SUB_LABEL) as SubKind[]).map((k) => (
            <Link
              key={k}
              href={subFilter === k ? "/admin#members" : `/admin?sub=${k}#members`}
              scroll={false}
              className={`rounded-full border px-3 py-1 ${
                subFilter === k ? "border-navy bg-navy text-white" : `border-line ${SUB_LABEL[k].cls} hover:border-accent`
              }`}
            >
              {SUB_LABEL[k].label} {subCounts[k]}
            </Link>
          ))}
        </div>
        {pendingMembers.length === 0 ? (
          <p className="mt-3 text-sm text-muted">承認待ちの会員はいません。</p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-[4px] border border-accent/40 bg-soft">
            {pendingMembers.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {m.name || "（氏名未入力）"}
                    <StudentBadge student={m.student} />
                    {m.offer === "early" && <OfferBadge />}
                    {m.staff && <StaffBadge />}
                  </p>
                  <p className="text-xs text-muted">
                    {m.email} / 登録日 {m.createdAt.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StudentButtons id={m.id} student={m.student} />
                  <OfferButton id={m.id} offer={m.offer} />
                  <StaffButton id={m.id} staff={m.staff} />
                  <MemberButtons id={m.id} current="pending" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {otherMembers.length > 0 && (
          <details className="mt-6" open={!!subFilter}>
            <summary className="cursor-pointer text-sm text-muted hover:text-accent">
              登録済みの会員一覧（{otherMembers.length}名{subFilter ? `・${SUB_LABEL[subFilter as SubKind]?.label ?? ""}のみ` : ""}）
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
                        <StudentBadge student={m.student} />
                    {m.offer === "early" && <OfferBadge />}
                    {m.staff && <StaffBadge />}
                        <SubBadge sub={subOf.get(m.id)} />
                      </p>
                      <p className="text-xs text-muted">
                        {m.email} / 登録日 {m.createdAt.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                        <SubDetail sub={subOf.get(m.id)} />
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StudentButtons id={m.id} student={m.student} />
                  <OfferButton id={m.id} offer={m.offer} />
                  <StaffButton id={m.id} staff={m.staff} />
                      <MemberButtons id={m.id} current={st} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </details>
        )}
      </section>

      {/* 当日入会の限定URL */}
      <section id="early-url" className="mt-12 scroll-mt-24">
        <h2 className="text-lg font-semibold">交流会当日入会の限定URL</h2>
        <p className="mt-1 text-sm text-muted">
          このURL（またはQRコード）から登録した人は、{PLANS.early.name}（月額 {yen(PLANS.early.amount)}）で申し込めます。料金表には表示されません。期限はありません。
        </p>
        {earlyJoinCode() ? (
          <p className="mt-3 break-all rounded-[4px] border border-line bg-soft px-4 py-3 font-mono text-sm">
            {`${getAppUrl()}/join/${earlyJoinCode()}`}
          </p>
        ) : (
          <p className="mt-3 rounded-[4px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            まだ使えません。Netlifyの環境変数 EARLY_JOIN_CODE に、推測されにくい英数字（6文字以上）を設定してください。
          </p>
        )}
        <p className="mt-2 text-xs text-muted">
          URLを使わずに入会した参加者には、会員一覧の「当日料金にする」で同じ料金を付けられます（申し込み前の人のみ反映）。
        </p>
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

      {/* Category order */}
      <section id="part-order" className="mt-12 scroll-mt-24">
        <h2 className="text-lg font-semibold">部位の並び順</h2>
        <p className="mt-1 text-sm text-muted">
          動画ページ・資料PDFページで部位を表示する順番です（動画・資料共通）。↑↓ で入れ替えられます。
        </p>
        <details className="mt-4 rounded-[4px] border border-line">
          <summary className="cursor-pointer px-4 py-3 text-sm">
            <span className="font-medium text-accent">並び順を変える</span>
            <span className="ml-3 text-xs text-muted">
              現在: {partOrder.map(categoryLabel).join(" → ")}
            </span>
          </summary>
          <ol className="divide-y divide-line border-t border-line">
            {partOrder.map((slug, i) => {
              const count =
                slug === SEMINAR_SLUG
                  ? allVideos.filter((v) => v.eventId || !v.bodyPart).length
                  : allVideos.filter((v) => v.bodyPart === slug).length;
              const pdfCount = slug === SEMINAR_SLUG ? null : allPdfs.filter((d) => d.bodyPart === slug).length;
              return (
                <li key={slug} className="flex items-center gap-3 px-4 py-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-soft font-sans text-xs text-muted">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium">
                    {categoryLabel(slug)}
                    <span className="ml-2 text-xs font-normal text-muted">
                      動画{count}本{pdfCount !== null ? `・資料${pdfCount}件` : ""}
                    </span>
                  </span>
                  <div className="flex gap-1">
                    {(["up", "down"] as const).map((dir) => (
                      <form key={dir} action={movePartAction}>
                        <input type="hidden" name="id" value={slug} />
                        <input type="hidden" name="dir" value={dir} />
                        <SubmitButton
                          pendingLabel="…"
                          disabled={dir === "up" ? i === 0 : i === partOrder.length - 1}
                          aria-label={`「${categoryLabel(slug)}」を${dir === "up" ? "上" : "下"}へ移動`}
                          className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-line text-sm leading-none text-muted hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-25"
                        >
                          {dir === "up" ? "↑" : "↓"}
                        </SubmitButton>
                      </form>
                    ))}
                  </div>
                </li>
              );
            })}
          </ol>
        </details>
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
              <option value="none">オフラインセミナー（部位で分けない）</option>
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
          <EventPicker events={allEvents} className={inputClass} />
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
          <PublishAtField id="add-video-publishAt" inputClass={inputClass} labelClass={labelClass} />
          <UnlockWeekField id="add-video-unlockWeek" inputClass={inputClass} labelClass={labelClass} />
          <PremiumField labelClass={labelClass} />
          <FreeField labelClass={labelClass} />
          <div className="sm:col-span-2">
            <SubmitButton
              pendingLabel="追加中…"
              className="rounded-[4px] bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              動画を追加
            </SubmitButton>
          </div>
        </form>

        <VideoAdminList videos={allVideos} events={allEvents} order={partOrder} />
      </section>

      {/* PDFs */}
      <section id="pdfs" className="mt-16 scroll-mt-24">
        <h2 className="text-lg font-semibold">PDF資料を追加</h2>
        <PdfUploadForm
          diseases={[...new Set(allPdfs.map((d) => d.disease).filter((d): d is string => !!d))].sort()}
        />

        <PdfAdminList docs={allPdfs} order={partOrder} />
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

function StudentBadge({ student }: { student: string | null }) {
  if (student === "approved")
    return <span className="ml-2 rounded-[3px] bg-accent/15 px-1.5 py-0.5 text-[11px] text-accent">学割</span>;
  if (student === "requested")
    return <span className="ml-2 rounded-[3px] border border-accent px-1.5 py-0.5 text-[11px] text-accent">学生（申告・未確認）</span>;
  return null;
}

function StudentButtons({ id, student }: { id: string; student: string | null }) {
  const btn = (value: string, label: string, cls: string, confirm?: string) => (
    <form action={setStudentAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="value" value={value} />
      <SubmitButton pendingLabel="処理中…" confirmMessage={confirm} className={`rounded-[4px] px-3 py-1.5 text-xs ${cls}`}>
        {label}
      </SubmitButton>
    </form>
  );
  if (student === "requested")
    return (
      <>
        {btn("approved", "学割を承認", "border border-accent text-accent hover:bg-accent hover:text-white")}
        {btn("none", "学割にしない", "border border-line text-muted hover:text-accent")}
      </>
    );
  if (student === "approved")
    return btn(
      "none",
      "学割を外す",
      "border border-line text-muted hover:text-accent",
      "学割を外します。契約中の場合、次回の更新分からスタンダード（¥3,980）に切り替わります。よろしいですか？",
    );
  return btn(
    "approved",
    "学割にする",
    "text-muted hover:text-accent",
    "この会員を学割（¥1,980）にします。契約中の場合、次回の更新分から学割料金に切り替わります。よろしいですか？",
  );
}

type SubInfo = {
  status: string;
  stripePriceId: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};
type SubKind = "active" | "canceling" | "trouble" | "ended" | "none";
const SUB_LABEL: Record<SubKind, { label: string; cls: string }> = {
  active: { label: "契約中", cls: "text-accent" },
  canceling: { label: "解約予定", cls: "text-amber-700" },
  trouble: { label: "支払いエラー", cls: "text-red-700" },
  ended: { label: "解約済み", cls: "text-muted" },
  none: { label: "未契約", cls: "text-muted" },
};
function subKind(s: SubInfo | undefined): SubKind {
  if (!s) return "none";
  if (s.status === "active" || s.status === "trialing") return s.cancelAtPeriodEnd ? "canceling" : "active";
  if (s.status === "past_due" || s.status === "unpaid" || s.status === "incomplete") return "trouble";
  return "ended";
}
function planOf(priceId: string | null): PlanKey | null {
  if (!priceId) return null;
  return (["premium", "student", "early", "standard"] as PlanKey[]).find((k) => priceIdFor(k) === priceId) ?? null;
}
const jpDate = (d: Date) => d.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });

function SubBadge({ sub }: { sub: SubInfo | undefined }) {
  const k = subKind(sub);
  if (k === "none") return null;
  const tone =
    k === "active"
      ? "bg-accent/15 text-accent"
      : k === "canceling"
        ? "bg-amber-50 text-amber-800"
        : k === "trouble"
          ? "bg-red-50 text-red-700"
          : "bg-soft text-muted";
  return <span className={`ml-2 rounded-[3px] px-1.5 py-0.5 text-[11px] ${tone}`}>{SUB_LABEL[k].label}</span>;
}

function SubDetail({ sub }: { sub: SubInfo | undefined }) {
  const k = subKind(sub);
  if (!sub || k === "none") return null;
  const plan = planOf(sub.stripePriceId);
  const parts = [plan ? `${PLANS[plan].name}` : null];
  if (sub.currentPeriodEnd) {
    if (k === "active") parts.push(`次回更新 ${jpDate(sub.currentPeriodEnd)}`);
    if (k === "canceling") parts.push(`${jpDate(sub.currentPeriodEnd)} で終了`);
    if (k === "ended") parts.push(`${jpDate(sub.currentPeriodEnd)} 終了`);
  }
  if (k === "trouble") parts.push("カードの支払いに失敗しています");
  const text = parts.filter(Boolean).join("・");
  return text ? <span> / {text}</span> : null;
}

function OfferBadge() {
  return <span className="ml-2 rounded-[3px] bg-accent/15 px-1.5 py-0.5 text-[11px] text-accent">当日入会料金</span>;
}

function OfferButton({ id, offer }: { id: string; offer: string | null }) {
  const on = offer === "early";
  return (
    <form action={setOfferAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="value" value={on ? "none" : "early"} />
      <SubmitButton
        pendingLabel="処理中…"
        confirmMessage={
          on
            ? "当日入会料金を外します。これから申し込む場合は通常料金になります。よろしいですか？"
            : `この会員を当日入会料金（${yen(PLANS.early.amount)}）にします。これから申し込む場合に反映されます。よろしいですか？`
        }
        className="rounded-[4px] px-3 py-1.5 text-xs text-muted hover:text-accent"
      >
        {on ? "当日料金を外す" : "当日料金にする"}
      </SubmitButton>
    </form>
  );
}

function StaffBadge() {
  return <span className="ml-2 rounded-[3px] bg-navy-deep px-1.5 py-0.5 text-[11px] text-white">運営</span>;
}

function StaffButton({ id, staff }: { id: string; staff: boolean }) {
  return (
    <form action={setStaffAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="value" value={staff ? "off" : "on"} />
      <SubmitButton
        pendingLabel="処理中…"
        confirmMessage={
          staff
            ? "運営メンバーから外します。有料プランに申し込んでいないと、動画・資料が見られなくなります。よろしいですか？"
            : "この会員を運営メンバーにします。有料プランに申し込まなくても、すべての動画・資料（プレミアム限定を含む）を見られます。よろしいですか？"
        }
        className="rounded-[4px] px-3 py-1.5 text-xs text-muted hover:text-accent"
      >
        {staff ? "運営から外す" : "運営にする"}
      </SubmitButton>
    </form>
  );
}
