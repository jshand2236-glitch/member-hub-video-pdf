import Link from "next/link";
import { verifyResetToken } from "@/lib/password-reset";
import ResetForm from "./reset-form";

export const metadata = {
  title: "パスワードの再設定 | AAM Fukuoka",
};

export default async function ResetPasswordPage(props: PageProps<"/reset-password">) {
  const searchParams = await props.searchParams;
  const tokenParam = searchParams?.token;
  const token = (Array.isArray(tokenParam) ? tokenParam[0] : tokenParam) ?? "";
  const valid = token ? Boolean(await verifyResetToken(token)) : false;

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-serif text-2xl font-semibold">パスワードの再設定</h1>
      {valid ? (
        <ResetForm token={token} />
      ) : (
        <div className="mt-8 border border-line bg-soft p-6 text-sm leading-loose">
          <p className="font-medium">このリンクは無効です。</p>
          <p className="mt-2 text-muted">
            有効期限（1時間）が切れているか、すでに使用済みの可能性があります。
          </p>
          <Link
            href="/forgot-password"
            className="mt-4 inline-block font-sans text-xs tracking-[0.18em] text-accent hover:underline"
          >
            再設定メールをもう一度送る →
          </Link>
        </div>
      )}
    </div>
  );
}
