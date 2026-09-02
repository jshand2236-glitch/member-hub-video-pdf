import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "AAM Fukuoka | 会員限定動画・資料",
  description:
    "医療者が学び続けるための会員制プラットフォーム。会員限定の動画講義と資料PDFを、いつでもどこでも。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line bg-soft">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="font-serif text-base font-semibold tracking-[0.18em]">
                AAM Fukuoka
              </p>
              <p className="mt-1 text-xs text-muted">
                学び続ける医療者のための、会員制プラットフォーム
              </p>
            </div>
            <div className="flex flex-wrap gap-5 text-xs text-muted">
              <Link href="/instructors" className="hover:text-accent">
                講師紹介
              </Link>
              <Link href="/videos" className="hover:text-accent">
                動画
              </Link>
              <Link href="/pdfs" className="hover:text-accent">
                資料PDF
              </Link>
            </div>
          </div>
          <div className="border-t border-line py-4 text-center text-[11px] tracking-widest text-muted">
            © {new Date().getFullYear()} AAM Fukuoka
          </div>
        </footer>
      </body>
    </html>
  );
}
