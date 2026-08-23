import { auth } from "@/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { redirect } from "next/navigation";
import CheckoutButton from "./checkout-button";

export const metadata = {
  title: "料金プラン | Member Hub",
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
      <h1 className="text-2xl font-bold">料金プラン</h1>
      <div className="mt-8 rounded-2xl border border-black/10 p-6 dark:border-white/10">
        <h2 className="text-lg font-semibold">スタンダードプラン</h2>
        <p className="mt-2 text-3xl font-bold">{priceLabel}</p>
        <ul className="mt-4 space-y-2 text-sm text-black/70 dark:text-white/70">
          <li>✔ 会員限定動画が見放題</li>
          <li>✔ 会員限定PDF資料が閲覧し放題</li>
          <li>✔ いつでも解約可能</li>
        </ul>
        <div className="mt-6">
          <CheckoutButton isLoggedIn={!!session?.user} />
        </div>
      </div>
    </div>
  );
}
