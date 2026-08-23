"use client";

import { useState, useTransition } from "react";

export default function ManageBillingButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/portal", { method: "POST" });
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
        className="rounded-full border border-foreground/15 px-5 py-2.5 text-sm font-medium hover:bg-foreground/5 disabled:opacity-50"
      >
        {isPending ? "処理中..." : "お支払い管理・解約"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
