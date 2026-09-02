import { auth } from "@/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { redirect } from "next/navigation";
import CheckoutButton from "./checkout-button";

export const metadata = {
  title: "料金プラン | AAM Fukuoka",
};

export default async function PricingPage() {
  const session = await auth();

  if (session?.user?.id) {
    const active = await hasActiveSubscription(session.user.id);
    if (active) {
      redirect("/dashboard");
    }
  }

  const priceLabel = process.env.NEXT_PUBLIC_PRICE_LABEL || "月額 ¥1,980";

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <span className="eyebrow">Plan</span>
      <h1 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">料金プラン</h1>
      <div className="mt-8 rounded-[4px] border border-line p-6">
        <h2 className="text-lg font-semibold">スタンダードプラン</h2>
        <p className="mt-2 text-3xl font-bold">{priceLabel}</p>
        <ul className="mt-4 space-y-2 text-sm text-muted">
          <li className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            会員限定動画が見放題
          </li>
          <li className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            会員限定PDF資料が閲覧し放題
          </li>
          <li className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            いつでも解約可能
          </li>
        </ul>
        <div className="mt-6">
          <CheckoutButton isLoggedIn={!!session?.user} />
        </div>
      </div>
    </div>
  );
}
