"use client";

import { useActionState } from "react";
import { resetPassword, type ResetState } from "./actions";

const initialState: ResetState = {};
const inputClass =
  "mt-1 w-full rounded-[4px] border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-accent";

export default function ResetForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          新しいパスワード（8文字以上）
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium">
          新しいパスワード（確認）
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[4px] bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "変更中..." : "パスワードを変更する"}
      </button>
    </form>
  );
}
