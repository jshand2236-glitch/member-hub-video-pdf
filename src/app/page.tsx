import Link from "next/link";
import { auth } from "@/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { isFreeAccessMode } from "@/lib/access";

export default async function Home() {
  const session = await auth();
  const freeAccess = isFreeAccessMode();
  const isSubscribed = session?.user?.id
    ? await hasActiveSubscription(session.user.id)
    : false;
  const canViewContent = freeAccess || isSubscribed;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          会員限定の動画とPDF資料を、
          <br />
          いつでもどこでも。
        </h1>
        <p className="mt-6 text-lg text-foreground/70">
          {freeAccess
            ? "会員登録すると、限定公開の動画コンテンツと資料PDFがすべて閲覧できるようになります。"
            : "月額プランに登録すると、限定公開の動画コンテンツと資料PDFがすべて閲覧できるようになります。"}
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          {session?.user ? (
            canViewContent ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white hover:opacity-90"
              >
                マイページへ
              </Link>
            ) : (
              <Link
                href="/pricing"
                className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white hover:opacity-90"
              >
                プランに登録する
              </Link>
            )
          ) : freeAccess ? (
            <Link
              href="/register"
              className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white hover:opacity-90"
            >
              会員登録して始める
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white hover:opacity-90"
              >
                会員登録して始める
              </Link>
              <Link
                href="/pricing"
                className="rounded-full border border-foreground/15 px-6 py-3 text-sm font-medium hover:bg-foreground/5"
              >
                料金プランを見る
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mt-20 grid gap-8 sm:grid-cols-2">
        <div className="rounded-2xl border border-foreground/10 p-6">
          <span className="text-xs font-medium tracking-widest text-accent">VIDEO</span>
          <h2 className="mt-1 text-lg font-semibold">限定動画</h2>
          <p className="mt-2 text-sm text-foreground/60">
            会員だけが視聴できる限定公開動画を配信します。
          </p>
        </div>
        <div className="rounded-2xl border border-foreground/10 p-6">
          <span className="text-xs font-medium tracking-widest text-accent">DOCUMENT</span>
          <h2 className="mt-1 text-lg font-semibold">資料PDF</h2>
          <p className="mt-2 text-sm text-foreground/60">
            会員限定の資料をブラウザ上でそのまま閲覧できます。
          </p>
        </div>
      </div>
    </div>
  );
}
