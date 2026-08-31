import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getLatestSubscription, hasActiveSubscription } from "@/lib/subscription";
import { isFreeAccessMode } from "@/lib/access";
import ManageBillingButton from "./manage-billing-button";

export const metadata = {
  title: "マイページ | Member Hub",
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

  const [active, subscription] = await Promise.all([
    hasActiveSubscription(session.user.id),
    getLatestSubscription(session.user.id),
  ]);

  // In free access mode, any logged-in member can view videos/PDFs -
  // subscription status is informational only (or not shown at all yet,
  // since there's nothing to subscribe to).
  const canViewContent = freeAccess || active;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold">マイページ</h1>
      <p className="mt-1 text-sm text-foreground/60">
        {session.user.email}
      </p>

      {!freeAccess && (
        <div className="mt-8 rounded-2xl border border-foreground/10 p-6">
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
                <p className="text-foreground/60">
                  次回更新日: {subscription.currentPeriodEnd.toLocaleDateString("ja-JP")}
                  {subscription.cancelAtPeriodEnd && "（この期間で解約予定）"}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-foreground/60">
              まだ有料プランに登録されていません。
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            {active ? (
              <ManageBillingButton />
            ) : (
              <Link
                href="/pricing"
                className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
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
            className="rounded-2xl border border-foreground/10 p-6 hover:bg-foreground/5"
          >
            <span className="text-xs font-medium tracking-widest text-accent">VIDEO</span>
            <h3 className="mt-1 font-semibold">会員限定動画を見る</h3>
          </Link>
          <Link
            href="/pdfs"
            className="rounded-2xl border border-foreground/10 p-6 hover:bg-foreground/5"
          >
            <span className="text-xs font-medium tracking-widest text-accent">DOCUMENT</span>
            <h3 className="mt-1 font-semibold">資料PDFを見る</h3>
          </Link>
        </div>
      )}
    </div>
  );
}
