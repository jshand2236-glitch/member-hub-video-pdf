import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hasActiveSubscription } from "@/lib/subscription";
import { isApprovedMember } from "@/lib/member-status";
import { isTrialEligible, TRIAL_DAYS } from "@/lib/billing";
import { isFreeAccessMode } from "@/lib/access";
import { PLANS, earlyBirdDate, formatJpDate, isEarlyBirdDay, planFor, priceLabel, yen, type PlanKey } from "@/lib/plans";
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
  const earlyDay = isEarlyBirdDay();

  let approved = false;
  let trial = TRIAL_DAYS > 0;
  let student: string | null = null;
  if (user) {
    const [active, ok, eligible, [row]] = await Promise.all([
      hasActiveSubscription(user.id!),
      isApprovedMember(user as { id: string; email?: string | null }),
      isTrialEligible(user.id!),
      db.select({ student: users.student }).from(users).where(eq(users.id, user.id!)).limit(1),
    ]);
    if (active) redirect("/dashboard");
    approved = ok;
    trial = eligible;
    student = row?.student ?? null;
  }
  const plan: PlanKey = planFor({ student });

  const rows: { key: PlanKey; note: string }[] = [
    { key: "standard", note: "一般の方" },
    { key: "early", note: `${formatJpDate(earlyBirdDate())} 医療者交流会の当日に入会された方` },
    { key: "student", note: "学生の方（会員登録時に申告・運営が確認）" },
  ];

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <span className="eyebrow">Plan</span>
      <h1 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">料金プラン</h1>

      {earlyDay && plan === "early" && (
        <p className="mt-6 rounded-[4px] border border-accent/50 bg-accent/10 px-4 py-3 text-sm">
          <Jp>{`本日限定 交流会当日入会プラン ${yen(PLANS.early.amount)}。本日お申し込みの方は、解約するまでずっとこの料金です。`}</Jp>
        </p>
      )}

      {user && (
        <div className="mt-8 rounded-[4px] border border-line p-6">
          <p className="text-xs text-muted">あなたの料金</p>
          <h2 className="mt-1 text-lg font-semibold">{PLANS[plan].name}</h2>
          <p className="mt-2 text-3xl font-bold">{priceLabel(plan)}</p>
          {plan !== "standard" && (
            <p className="mt-1 text-xs text-muted">
              <Jp>{`通常 ${yen(PLANS.standard.amount)} → ${yen(PLANS[plan].amount)}`}</Jp>
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
              <Notice>有料プランは近日開始予定です。現在は会員登録（運営の承認）だけで、すべての動画と資料を無料でご利用いただけます。</Notice>
            ) : !approved ? (
              <Notice>運営による会員登録の承認後にお申し込みいただけます。承認が完了するとメールでお知らせします。</Notice>
            ) : student === "requested" ? (
              <Notice>学割の確認中です。運営の確認が終わると、学割価格でお申し込みいただけます。</Notice>
            ) : (
              <CheckoutButton isLoggedIn trial={trial} trialDays={TRIAL_DAYS} />
            )}
          </div>
        </div>
      )}

      <div className={`${user ? "mt-8" : "mt-8"} rounded-[4px] border border-line`}>
        <p className="border-b border-line px-5 py-3 text-sm font-semibold">プラン一覧（月額・税込）</p>
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li
              key={r.key}
              className={`flex items-center justify-between gap-4 px-5 py-4 ${user && r.key === plan ? "bg-accent/5" : ""}`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{PLANS[r.key].name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  <Jp>{r.note}</Jp>
                </p>
              </div>
              <p className="shrink-0 text-lg font-bold">{yen(PLANS[r.key].amount)}</p>
            </li>
          ))}
        </ul>
        {!user && (
          <div className="border-t border-line p-5">
            <CheckoutButton isLoggedIn={false} />
          </div>
        )}
      </div>

      <div className="mt-6 space-y-1.5 text-xs leading-relaxed text-muted">
        <p>
          <Jp>お支払いはクレジットカード（Stripe）です。お申し込み日に初回の料金が発生し、以後1か月ごとに自動更新されます。料金はお申し込み時のプランのまま、解約するまで変わりません。</Jp>
        </p>
        <p>
          <Jp>学割は在学中の方が対象です。卒業後はスタンダードプランの料金に切り替わります（切り替え後の次回更新分から）。</Jp>
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

function Notice({ children }: { children: string }) {
  return (
    <p className="rounded-[4px] bg-soft p-4 text-sm text-muted">
      <Jp>{children}</Jp>
    </p>
  );
}
