"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { registerAction, type RegisterState } from "./actions";

const initialState: RegisterState = {};

const inputClass =
  "mt-1 w-full rounded-[4px] border border-line bg-background px-3 py-2.5 text-base outline-none focus:border-accent sm:text-sm";

export default function RegisterForm({ studentDefault = false }: { studentDefault?: boolean }) {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const [isStudent, setIsStudent] = useState(studentDefault);
  const [showPassword, setShowPassword] = useState(false);
  const v = state.values;

  return (
    // key: エラーで戻ってきたとき、入力していた内容を入れ直す
    <form key={v ? JSON.stringify(v) : "new"} action={formAction} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          お名前 <Required />
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={100}
          autoComplete="name"
          defaultValue={v?.name}
          placeholder="例：福岡 太郎"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-muted">承認の確認に使うため、本名でご入力ください。</p>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          メールアドレス <Required />
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          defaultValue={v?.email}
          placeholder="例：taro@example.com"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-muted">ログインと、承認のお知らせに使います。</p>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          パスワード <Required />
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="8文字以上"
            className={`${inputClass} pr-16`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-pressed={showPassword}
            className="absolute right-2 top-1/2 mt-0.5 -translate-y-1/2 rounded-[4px] px-2 py-1 text-xs text-muted hover:text-accent"
          >
            {showPassword ? "隠す" : "表示"}
          </button>
        </div>
      </div>

      <div className="rounded-[4px] border border-line px-3 py-3 text-sm">
        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            name="student"
            checked={isStudent}
            onChange={(e) => setIsStudent(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-accent"
          />
          <span>
            医療系の学生です（学割を希望）
            <span className="mt-0.5 block text-xs text-muted">
              運営が確認のうえ、学割価格（月額 ¥1,980）でお申し込みいただけます。確認のため、学生証などをお願いすることがあります。
            </span>
          </span>
        </label>
        {isStudent && (
          <div className="mt-3 pl-6">
            <label htmlFor="school" className="block text-xs font-medium">
              学校名・学年 <Required />
            </label>
            <input
              id="school"
              name="school"
              required
              maxLength={100}
              defaultValue={v?.school}
              placeholder="例：〇〇医療専門学校 理学療法学科 2年"
              className={inputClass}
            />
          </div>
        )}
      </div>

      {state.error && (
        <p role="alert" className="rounded-[4px] border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
          {state.error.includes("既に登録") && (
            <>
              {" "}
              <Link href="/login" className="underline">
                ログイン
              </Link>
              ／
              <Link href="/forgot-password" className="underline">
                パスワード再設定
              </Link>
            </>
          )}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[4px] bg-accent px-6 py-3.5 text-sm font-medium tracking-wider text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "登録中..." : "無料で会員登録する"}
      </button>
      <p className="text-center text-xs text-muted">登録しただけで料金がかかることはありません。</p>
    </form>
  );
}

function Required() {
  return <span className="ml-1 rounded-[3px] bg-accent/15 px-1.5 py-0.5 align-middle text-[10px] font-medium text-accent">必須</span>;
}
