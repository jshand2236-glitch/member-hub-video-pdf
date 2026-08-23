import Link from "next/link";
import LoginForm from "./login-form";

export const metadata = {
  title: "ログイン | Member Hub",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const callbackUrlParam = searchParams?.callbackUrl;
  const callbackUrl = Array.isArray(callbackUrlParam)
    ? callbackUrlParam[0]
    : callbackUrlParam ?? "/dashboard";

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold">ログイン</h1>
      <LoginForm callbackUrl={callbackUrl} />
      <p className="mt-6 text-center text-sm text-black/60 dark:text-white/60">
        会員登録がまだの方は{" "}
        <Link href="/register" className="underline">
          会員登録
        </Link>
      </p>
    </div>
  );
}
