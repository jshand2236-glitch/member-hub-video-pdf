"use client";

import { useActionState } from "react";
import { registerAction, type RegisterState } from "./actions";

const initialState: RegisterState = {};

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          お名前（任意）
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          className="mt-1 w-full rounded-[4px] border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
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
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          パスワード（8文字以上）
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 w-full rounded-[4px] border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <label className="flex items-start gap-2.5 rounded-[4px] border border-line px-3 py-3 text-sm">
        <input type="checkbox" name="student" className="mt-0.5 h-4 w-4 accent-accent" />
        <span>
          学生です（学割を希望）
          <span className="mt-0.5 block text-xs text-muted">
            運営が確認のうえ、学割価格（月額 ¥1,980）でお申し込みいただけます。確認のため、学校名などをお伺いすることがあります。
          </span>
        </span>
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[4px] bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "登録中..." : "会員登録する"}
      </button>
    </form>
  );
}
