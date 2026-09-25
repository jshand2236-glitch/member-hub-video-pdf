"use client";

import { useActionState } from "react";
import { requestPasswordReset, type ForgotState } from "./actions";

const initialState: ForgotState = {};

export default function ForgotForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  if (state.sent) {
    return (
      <div className="mt-8 border border-line bg-soft p-6 text-sm leading-loose">
        <p className="font-medium">メールを送信しました。</p>
        <p className="mt-2 text-muted">
          ご登録のメールアドレス宛に、パスワード再設定用のリンクをお送りしました（有効期限1時間）。
          数分たっても届かない場合は、迷惑メールフォルダもご確認ください。
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-[4px] border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[4px] bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "送信中..." : "再設定メールを送る"}
      </button>
    </form>
  );
}
