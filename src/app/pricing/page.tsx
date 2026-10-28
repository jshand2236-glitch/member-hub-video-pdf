import Link from "next/link";
import { auth } from "@/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { isApprovedMember } from "@/lib/member-status";
import { isTrialEligible, PRICE_LABEL, TRIAL_DAYS } from "@/lib/billing";
import { isFreeAccessMode } from "@/lib/access";
import { redirect } from "next/navigation";
import CheckoutButton from "./checkout-button";
import Jp from "@/components/jp";

export const metadata = {
  title: "料金プラン | FMC",
};

const FEATURES = [
  "会員限定の動画講義が見放題",
  "講義資料・まとめPDFが閲覧し放題",
  "オフラインセミナー（医療者交流会）のアーカイブ動画",
  "いつでもマイページから解約可能",
];

export default async function PricingPage() {
  const session = await auth();
  const user = session?.user?.id ? session.user : null;

  let approved = false;
  let trial = TRIAL_DAYS > 0; // 未ログインの人には「新規登録なら無料お試し」を案内
  if (user) {
    const [active, ok, eligible] = await Promise.all([
      hasActiveSubscription(user.id!),
      isApprovedMember(user as { id: string; email?: string | null }),
      isTrialEligible(user.id!),
    ]);
    if (active) redirect("/dashboard");
    approved = ok;
    trial = eligible;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <span className="eyebrow">Plan</span>
      <h1 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">料金プラン</h1>
      <div className="mt-8 rounded-[4px] border border-line p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">スタンダードプラン</h2>
          {trial && (
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              {TRIAL_DAYS}日間無料
            </span>
          )}
        </div>
        <p className="mt-2 text-3xl font-bold">{PRICE_LABEL}</p>
        {trial && (
          <p className="mt-2 text-sm text-muted">
            <Jp>{`はじめての方は${TRIAL_DAYS}日間無料でお試しいただけます。`}</Jp>
          </p>
        )}
        <ul className="mt-5 space-y-2 text-sm text-muted">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              <Jp>{f}</Jp>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          {isFreeAccessMode() ? (
            <p className="rounded-[4px] bg-soft p-4 text-sm text-muted">
              <Jp>有料プランは近日開始予定です。現在は会員登録（運営の承認）だけで、すべての動画と資料を無料でご利用いただけます。</Jp>
            </p>
          ) : user && !approved ? (
            <p className="rounded-[4px] bg-soft p-4 text-sm text-muted">
              <Jp>運営による会員登録の承認後にお申し込みいただけます。承認が完了するとメールでお知らせします。</Jp>
            </p>
          ) : (
            <CheckoutButton isLoggedIn={!!user} trial={trial} trialDays={TRIAL_DAYS} />
          )}
        </div>
      </div>

      <div className="mt-6 space-y-1.5 text-xs leading-relaxed text-muted">
        <p>
          <Jp>
            {trial
              ? `お支払いはクレジットカード（Stripe）です。無料期間が終わると自動で有料プランに切り替わり、以後1か月ごとに自動更新されます。無料期間中に解約すれば料金はかかりません。`
              : `お支払いはクレジットカード（Stripe）です。お申し込み日に初回の料金が発生し、以後1か月ごとに自動更新されます。`}
          </Jp>
        </p>
        <p>
          <Jp>解約はマイページの「お支払い情報・解約」からいつでも行えます。解約後も、お支払い済みの期間の終わりまではご利用いただけます。日割りでの返金はありません。</Jp>
        </p>
        <p className="pt-2">
          <Link href="/legal/tokushoho" className="text-accent hover:underline">
            特定商取引法に基づく表記
          </Link>
        </p>
      </div>
    </div>
  );
}
