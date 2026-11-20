import Link from "next/link";
import RegisterForm from "./register-form";
import Jp from "@/components/jp";
import { isFreeAccessMode, paidStartLabel } from "@/lib/access";
import { yen } from "@/lib/plans";
import { getPricing } from "@/lib/pricing";

export const metadata = {
  title: "会員登録 | FMC",
};

const MERITS = [
  { title: "動画講義が見放題", body: "現役の医療者3名が、臨床で使える技術と考え方を配信" },
  { title: "資料PDFが読み放題", body: "講義資料やまとめノートを、部位ごとにいつでも確認" },
  { title: "交流会のアーカイブ", body: "医療者交流会の講義を、参加できなかった回も視聴" },
];

export default async function RegisterPage(props: PageProps<"/register">) {
  const sp = await props.searchParams;
  const studentDefault = sp?.student === "1";
  const freeAccess = isFreeAccessMode();
  const pricing = await getPricing();
  const f = pricing.founder;
  // 表示する料金：期間限定プランの受付中なら ¥980、終わったら通常料金（学割つき）
  const priceText = f.open
    ? `月額 ${yen(f.amount)}（期間限定）`
    : `月額 ${yen(pricing.standard.amount)}（学割 ${yen(pricing.student.amount)}）`;

  const steps = [
    { title: "会員登録", body: "このページから。1分ほどで終わります。" },
    { title: "運営が確認", body: "医療従事者限定のため、運営がご登録内容を確認します。" },
    freeAccess
      ? { title: "利用開始", body: "承認のメールが届いたら、すべての動画と資料をご覧いただけます。" }
      : { title: "プランに申し込み", body: "承認のメールが届いたら、料金プランを選んで利用開始です。" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="grid gap-8 md:grid-cols-[1fr_minmax(0,26rem)] md:gap-x-14 md:gap-y-0">
        {/* 見出し（スマホではこの直後にフォーム） */}
        <div className="md:col-start-1 md:row-start-1">
          <span className="eyebrow">Join FMC</span>
          <h1 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">
            {studentDefault ? "会員登録（学割）" : "会員登録"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            <Jp>福岡の医療者が学び続けるための会員制サイトです。</Jp>
          </p>
          {f.open && (
            <p className="mt-5 rounded-[4px] border border-accent bg-accent/10 px-4 py-3 text-sm">
              <span className="font-semibold">{`期間限定 月額 ${yen(f.amount)}`}</span>
                            <span className="mt-1 block text-xs leading-relaxed text-muted">
                <Jp>期間中にお申し込みの方は、解約するまでずっとこの料金でご利用いただけます。期間後は料金が上がります。</Jp>
              </span>
            </p>
          )}
        </div>

        {/* フォーム */}
        <div className="md:col-start-2 md:row-span-2 md:row-start-1 md:pt-2">
          <div className="rounded-[4px] border border-line bg-background p-5 sm:p-7">
            <RegisterForm studentDefault={studentDefault} />
          </div>
          <p className="mt-6 text-center text-sm text-muted">
            すでに会員の方は{" "}
            <Link href="/login" className="underline">
              ログイン
            </Link>
          </p>
        </div>

        {/* 案内 */}
        <div className="md:col-start-1 md:row-start-2 md:pt-8">

          <ul className="space-y-4">
            {MERITS.map((m) => (
              <li key={m.title} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium">{m.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">
                    <Jp>{m.body}</Jp>
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-[4px] border border-line bg-soft px-4 py-3 text-sm">
            {freeAccess ? (
              <p>
                <span className="font-medium">いまは無料でご利用いただけます。</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  <Jp>{`${paidStartLabel()}から有料プラン（${priceText}）が始まります。お申し込みいただくまで料金はかかりません。`}</Jp>
                </span>
              </p>
            ) : (
              <p>
                <span className="font-medium">{priceText}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  <Jp>会員登録は無料です。料金は承認後にプランをお申し込みいただいた時点から発生し、いつでも解約できます。</Jp>
                </span>
              </p>
            )}
          </div>

          <h2 className="mt-10 text-sm font-semibold">登録から利用開始まで</h2>
          <ol className="mt-4 space-y-4">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent font-sans text-xs text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">
                    <Jp>{s.body}</Jp>
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/free" className="text-accent hover:underline">
              無料動画を見てみる →
            </Link>
            {!studentDefault && (
              <Link href="/student" className="text-accent hover:underline">
                学生の方へ →
              </Link>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
