"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutButton({
  isLoggedIn,
  trial = false,
  trialDays = 0,
  tier = "basic",
  label,
  variant = "primary",
}: {
  isLoggedIn: boolean;
  trial?: boolean;
  trialDays?: number;
  tier?: "basic" | "premium";
  label?: string;
  variant?: "primary" | "outline";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    if (!isLoggedIn) {
      router.push("/register?next=/pricing");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "エラーが発生しました");
          return;
        }
        window.location.href = data.url;
      } catch {
        setError("通信エラーが発生しました");
      }
    });
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className={`w-full rounded-[4px] px-6 py-3 text-sm font-medium disabled:opacity-50 ${
          variant === "primary"
            ? "bg-accent text-white hover:bg-accent-hover"
            : "border border-accent text-accent hover:bg-accent hover:text-white"
        }`}
      >
        {isPending
          ? "処理中..."
          : !isLoggedIn
            ? "会員登録して申し込む"
            : trial
              ? `${trialDays}日間無料で始める`
              : (label ?? "このプランに申し込む")}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
