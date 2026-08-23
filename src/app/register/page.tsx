import Link from "next/link";
import RegisterForm from "./register-form";

export const metadata = {
  title: "会員登録 | Member Hub",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold">会員登録</h1>
      <p className="mt-2 text-sm text-foreground/60">
        登録後、料金プランのお申し込み画面に進みます。
      </p>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-foreground/60">
        すでに会員の方は{" "}
        <Link href="/login" className="underline">
          ログイン
        </Link>
      </p>
    </div>
  );
}
