"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutButton({ isLoggedIn }: { isLoggedIn: boolean }) {
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
        const res = await fetch("/api/stripe/checkout", { method: "POST" });
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
        className="w-full rounded-[4px] bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {isPending ? "処理中..." : isLoggedIn ? "このプランに登録する" : "会員登録して申し込む"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
