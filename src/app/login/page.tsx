import Link from "next/link";
import LoginForm from "./login-form";

export const metadata = {
  title: "ログイン | FMC",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const callbackUrlParam = searchParams?.callbackUrl;
  const callbackUrl = Array.isArray(callbackUrlParam)
    ? callbackUrlParam[0]
    : callbackUrlParam ?? "/dashboard";
  const justReset = searchParams?.reset === "1";

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-serif text-2xl font-semibold">ログイン</h1>
      {justReset && (
        <p className="mt-6 border border-line bg-soft px-4 py-3 text-sm">
          パスワードを変更しました。新しいパスワードでログインしてください。
        </p>
      )}
      <LoginForm callbackUrl={callbackUrl} />
      <p className="mt-4 text-right text-sm">
        <Link href="/forgot-password" className="text-muted underline hover:text-accent">
          パスワードをお忘れの方
        </Link>
      </p>
      <p className="mt-6 text-center text-sm text-muted">
        会員登録がまだの方は{" "}
        <Link href="/register" className="underline">
          会員登録
        </Link>
      </p>
    </div>
  );
}
