import Link from "next/link";
import ForgotForm from "./forgot-form";

export const metadata = {
  title: "パスワードをお忘れの方 | AAM Fukuoka",
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-serif text-2xl font-semibold">パスワードをお忘れの方</h1>
      <p className="mt-3 text-sm leading-loose text-muted">
        ご登録のメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
      </p>
      <ForgotForm />
      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="underline">
          ログイン画面に戻る
        </Link>
      </p>
    </div>
  );
}
