import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function Nav() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="leading-tight">
          <span className="block font-serif text-lg font-semibold tracking-[0.18em]">
            AAM Fukuoka
          </span>
          <span className="hidden text-[10px] tracking-[0.28em] text-muted sm:block">
            MEMBERS
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/instructors" className="hidden hover:text-accent sm:block">
            講師紹介
          </Link>
          {session?.user ? (
            <>
              <Link href="/dashboard" className="hover:text-accent">
                マイページ
              </Link>
              <Link href="/videos" className="hover:text-accent">
                動画
              </Link>
              <Link href="/pdfs" className="hover:text-accent">
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
                  className="rounded-[4px] border border-line px-3 py-1.5 text-xs tracking-wider hover:border-accent hover:text-accent"
                >
                  ログアウト
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-accent">
                ログイン
              </Link>
              <Link
                href="/register"
                className="rounded-[4px] bg-accent px-4 py-2 text-xs tracking-wider text-white hover:bg-accent-hover"
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
