import type { Metadata } from "next";
import Nav from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Member Hub | 会員限定動画・資料",
  description: "会員登録した方だけが動画とPDF資料を閲覧できる会員制サイト",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-foreground/10 py-6 text-center text-xs text-foreground/50">
          © {new Date().getFullYear()} Member Hub
        </footer>
      </body>
    </html>
  );
}
