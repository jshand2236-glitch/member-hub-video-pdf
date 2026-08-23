import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function Nav() {
  const session = await auth();

  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Member Hub
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          {session?.user ? (
            <>
              <Link href="/dashboard" className="hover:underline">
                マイページ
              </Link>
              <Link href="/videos" className="hover:underline">
                動画
              </Link>
              <Link href="/pdfs" className="hover:underline">
                資料PDF
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-full border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                >
                  ログアウト
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/pricing" className="hover:underline">
                料金プラン
              </Link>
              <Link href="/login" className="hover:underline">
                ログイン
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-foreground px-3 py-1.5 text-sm text-background hover:opacity-90"
              >
                会員登録
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
