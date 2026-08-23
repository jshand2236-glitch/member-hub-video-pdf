import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getLatestSubscription, hasActiveSubscription } from "@/lib/subscription";
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

  const [active, subscription] = await Promise.all([
    hasActiveSubscription(session.user.id),
    getLatestSubscription(session.user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold">マイページ</h1>
      <p className="mt-1 text-sm text-foreground/60">
        {session.user.email}
      </p>

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

      {active && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <Link
            href="/videos"
            className="rounded-2xl border border-foreground/10 p-6 hover:bg-foreground/5"
          >
            <h3 className="font-semibold">🎥 会員限定動画を見る</h3>
          </Link>
          <Link
            href="/pdfs"
            className="rounded-2xl border border-foreground/10 p-6 hover:bg-foreground/5"
          >
            <h3 className="font-semibold">📄 資料PDFを見る</h3>
          </Link>
        </div>
      )}
    </div>
  );
}
