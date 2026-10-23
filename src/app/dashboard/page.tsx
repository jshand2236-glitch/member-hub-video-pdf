import { isPublishedSql } from "@/lib/publish";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getLatestSubscription, hasActiveSubscription } from "@/lib/subscription";
import { isFreeAccessMode } from "@/lib/access";
import ManageBillingButton from "./manage-billing-button";
import { getMemberStatus, isApprovedMember } from "@/lib/member-status";
import MemberStatusNotice from "@/components/member-status-notice";
import UpcomingEvents from "@/components/upcoming-events";
import { getUpcomingEvents } from "@/lib/events";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { and, isNotNull, isNull, or } from "drizzle-orm";

export const metadata = {
  title: "マイページ | FMC",
};

const STATUS_LABEL_JA: Record<string, string> = {
  active: "有効",
  trialing: "無料トライアル中",
  past_due: "支払い遅延",
  canceled: "解約済み",
  unpaid: "未払い",
  incomplete: "手続き未完了",
  incomplete_expired: "手続き期限切れ",
  paused: "一時停止中",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const freeAccess = isFreeAccessMode();

  const [active, subscription, approved, memberStatus, upcomingEvents, seminarVideos] = await Promise.all([
    hasActiveSubscription(session.user.id),
    getLatestSubscription(session.user.id),
    isApprovedMember(session.user),
    getMemberStatus(session.user.id),
    getUpcomingEvents(4),
    db.select({ id: videos.id }).from(videos).where(and(or(isNotNull(videos.eventId), isNull(videos.bodyPart)), isPublishedSql(videos.publishAt))),
  ]);

  // In free access mode, any logged-in member can view videos/PDFs -
  // subscription status is informational only (or not shown at all yet,
  // since there's nothing to subscribe to).
  const canViewContent = approved && (freeAccess || active);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <span className="eyebrow">My page</span>
      <h1 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">マイページ</h1>
      <p className="mt-1 text-sm text-muted">
        {session.user.email}
      </p>

      {!approved && (
        <div className="mt-8">
          <MemberStatusNotice status={memberStatus} />
        </div>
      )}

      <UpcomingEvents events={upcomingEvents} />

      {approved && !freeAccess && (
        <div className="mt-8 rounded-[4px] border border-line p-6">
          <h2 className="text-lg font-semibold">会員ステータス</h2>
          {subscription ? (
            <div className="mt-3 space-y-1 text-sm">
              <p>
                状態:{" "}
                <span className="font-medium">
                  {STATUS_LABEL_JA[subscription.status] ?? subscription.status}
                </span>
              </p>
              {subscription.currentPeriodEnd && (
                <p className="text-muted">
                  {subscription.status === "trialing" ? "無料期間の終了日（初回のお支払い日）" : "次回更新日"}:{" "}
                  {subscription.currentPeriodEnd.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                  {subscription.cancelAtPeriodEnd && "（この期間で解約予定）"}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">
              まだ有料プランに登録されていません。
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            {active ? (
              <ManageBillingButton />
            ) : (
              <Link
                href="/pricing"
                className="rounded-[4px] bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
              >
                プランに登録する
              </Link>
            )}
          </div>
        </div>
      )}

      {canViewContent && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <Link
            href="/videos"
            className="rounded-[4px] border border-line p-6 hover:bg-soft"
          >
            <span className="eyebrow">VIDEO</span>
            <h3 className="mt-1 font-semibold">会員限定動画を見る</h3>
          </Link>
          <Link
            href="/pdfs"
            className="rounded-[4px] border border-line p-6 hover:bg-soft"
          >
            <span className="eyebrow">DOCUMENT</span>
            <h3 className="mt-1 font-semibold">資料PDFを見る</h3>
          </Link>
          {seminarVideos.length > 0 && (
            <Link
              href="/videos?part=seminar"
              className="rounded-[4px] border border-accent/40 bg-soft p-6 hover:border-accent sm:col-span-2"
            >
              <span className="eyebrow">OFFLINE SEMINAR</span>
              <h3 className="mt-1 font-semibold">オフラインセミナーの動画を見る</h3>
              <p className="mt-1 text-xs text-muted">参加できなかった回のセミナーも、講師ごとに視聴できます（{seminarVideos.length}本）。</p>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
