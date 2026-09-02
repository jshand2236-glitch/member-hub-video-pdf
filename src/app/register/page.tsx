import Link from "next/link";
import RegisterForm from "./register-form";
import { isFreeAccessMode } from "@/lib/access";

export const metadata = {
  title: "会員登録 | AAM Fukuoka",
};

export default function RegisterPage() {
  const freeAccess = isFreeAccessMode();

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-serif text-2xl font-semibold">会員登録</h1>
      <p className="mt-2 text-sm text-muted">
        {freeAccess
          ? "登録後すぐに、会員限定の動画・PDF資料をご覧いただけます。"
          : "登録後、料金プランのお申し込み画面に進みます。"}
      </p>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-muted">
        すでに会員の方は{" "}
        <Link href="/login" className="underline">
          ログイン
        </Link>
      </p>
    </div>
  );
}
