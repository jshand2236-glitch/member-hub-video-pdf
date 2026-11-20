import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hasActiveSubscription } from "@/lib/subscription";
import { isApprovedMember } from "@/lib/member-status";
import { isTrialEligible, TRIAL_DAYS } from "@/lib/billing";
import { isFreeAccessMode, paidStartLabel } from "@/lib/access";
import { type PlanKey } from "@/lib/plans";
import { basePlanFor, getPricing } from "@/lib/pricing";
import { redirect } from "next/navigation";
import CheckoutButton from "./checkout-button";
import Jp from "@/components/jp";
import PriceTable, { PricingInfo } from "@/components/price-table";

export const metadata = {
  title: "料金プラン | FMC",
};

export default async function PricingPage() {
  const session = await auth();
  const user = session?.user?.id ? session.user : null;
  const freeAccess = isFreeAccessMode();

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
  const pricing = await getPricing();
  const base: PlanKey = basePlanFor({ student }, pricing);

  // ログイン中の人のボタン（申し込めない理由があれば案内文）
  const memberAction = (key: PlanKey) => {
    if (freeAccess) return <Notice>{`有料プランは${paidStartLabel()}から開始します。それまでは無料でご利用いただけます。`}</Notice>;
    if (!approved) return <Notice>運営による会員登録の承認後にお申し込みいただけます。</Notice>;
    if (key !== "premium" && key !== "founder" && student === "requested")
      return <Notice>学割の確認中です。運営の確認が終わると、学割価格でお申し込みいただけます。</Notice>;
    return key === "premium" ? (
      <CheckoutButton isLoggedIn tier="premium" variant="outline" label="プレミアムに申し込む" />
    ) : (
      <CheckoutButton isLoggedIn trial={trial} trialDays={TRIAL_DAYS} label="このプランに申し込む" />
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <span className="eyebrow">Plan</span>
        <h1 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">料金プランのご案内</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-loose text-muted">
          <Jp>FMCは、福岡の医療者が学び続けるための会員制サイトです。すべての動画講義と資料PDFをご覧いただけます。</Jp>
        </p>
        {freeAccess && (
          <p className="mx-auto mt-4 max-w-xl rounded-[4px] border border-accent/40 bg-accent/5 px-4 py-3 text-sm">
            <Jp>{`現在は会員登録（運営の承認）だけで無料でご利用いただけます。${paidStartLabel()}から、下記の料金プランに切り替わります。`}</Jp>
          </p>
        )}
      </div>

      <div className="mt-12">
        <PriceTable pricing={pricing} base={base} current={!!user && base === "student"} action={user ? memberAction : undefined} />
      </div>
      <PricingInfo showJoin={!user} />
      <p className="mt-12 text-center text-xs">
        <Link href="/legal/tokushoho" className="text-accent hover:underline">
          特定商取引法に基づく表記
        </Link>
      </p>
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
