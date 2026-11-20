import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import Jp from "@/components/jp";
import SubmitButton from "@/components/submit-button";
import { isFreeAccessMode, paidStartLabel } from "@/lib/access";
import { PLANS, yen } from "@/lib/plans";
import { getPricing } from "@/lib/pricing";
import { requestStudentAction } from "./actions";

export const metadata = {
  title: "学生の方へ（学割） | FMC",
  description: `医療系の学生は月額 ${yen(PLANS.student.amount)} の学割でFMCの動画講義と資料PDFを利用できます。`,
};

const STEPS = [
  { title: "会員登録", body: "登録フォームで「学生です（学割を希望）」にチェックを入れ、学校名と学年を入力します。" },
  { title: "運営が確認", body: "運営が学生であることを確認します。確認が終わるとメールでお知らせします。" },
  { title: `${yen(PLANS.student.amount)}で申し込み`, body: "料金プランのページから、学割価格でお申し込みいただけます。" },
];

const MERITS = [
  "現役の医療者が講師の動画講義が見放題",
  "講義資料・まとめPDFが閲覧し放題",
  "実習や国家試験の前に、部位ごとに復習できる",
  "医療者交流会のアーカイブで、現場の考え方にふれられる",
];

export default async function StudentPage(props: PageProps<"/student">) {
  const sp = await props.searchParams;
  const requested = sp?.requested === "1";
  const schoolError = sp?.error === "school";
  const session = await auth();
  const freeAccess = isFreeAccessMode();
  const pricing = await getPricing();

  let student: string | null = null;
  if (session?.user?.id) {
    const [row] = await db
      .select({ student: users.student })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    student = row?.student ?? null;
  }

  return (
    <>
      <section className="bg-[linear-gradient(100deg,#091326_0%,#16264a_100%)]">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-24">
          <span className="eyebrow eyebrow-light">For students</span>
          <h1 className="mt-4 font-serif text-3xl font-semibold leading-snug text-white sm:text-4xl">
            学生のうちから、
            <br />
            現場の学びを。
          </h1>
          <p className="mt-6 text-sm leading-loose text-white/80">
            <Jp>医療系の学校に通う学生の方は、学割でFMCをご利用いただけます。</Jp>
          </p>
          <div className="mt-8 inline-flex items-baseline gap-3 rounded-[4px] border border-white/20 bg-white/5 px-5 py-4">
            <span className="text-xs text-white/70">学割プラン 月額</span>
            <span className="text-3xl font-bold text-white">{yen(PLANS.student.amount)}</span>
            <span className="text-xs text-white/60 line-through">{yen(pricing.standard.amount)}</span>
          </div>
          {pricing.founder.open && (
            <p className="mt-4 max-w-xl rounded-[4px] border border-accent/60 bg-accent/15 px-4 py-3 text-sm text-white">
              <Jp>{`いまは期間限定プラン（月額 ${yen(pricing.founder.amount)}）があり、学生の方も学割よりお得にお申し込みいただけます（解約するまでずっとこの料金）。期間後は学割が適用されます。`}</Jp>
            </p>
          )}
          {freeAccess && (
            <p className="mt-4 text-xs leading-relaxed text-white/70">
              <Jp>{`※ 現在は会員登録だけで無料でご利用いただけます（${paidStartLabel()}から有料プランが始まります）。学割の申請は今のうちから受け付けています。`}</Jp>
            </p>
          )}
          {!session?.user && (
            <div className="mt-10">
              <Link href="/register?student=1" className="btn btn-primary">
                学割で会員登録する
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <span className="eyebrow">What you get</span>
          <h2 className="mt-3 font-serif text-2xl font-semibold">学割でできること</h2>
          <ul className="mt-6 space-y-3 text-sm">
            {MERITS.map((m) => (
              <li key={m} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                <Jp>{m}</Jp>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-muted">
            <Jp>内容は一般の会員と同じです。料金だけが学割価格になります。</Jp>
          </p>
        </div>
      </section>

      <section className="bg-soft">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <span className="eyebrow">How to apply</span>
          <h2 className="mt-3 font-serif text-2xl font-semibold">申し込みの流れ</h2>
          <ol className="mt-8 space-y-6">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent font-sans text-sm text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    <Jp>{s.body}</Jp>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="apply" className="scroll-mt-24 bg-background">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          {!session?.user ? (
            <div className="rounded-[4px] border border-line p-6 text-center">
              <p className="text-sm">
                <Jp>はじめての方は、会員登録から学割を申請できます。</Jp>
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link href="/register?student=1" className="btn btn-primary">
                  学割で会員登録する
                </Link>
                <Link
                  href="/login?callbackUrl=/student%23apply"
                  className="btn btn-outline"
                >
                  ログインして申請する
                </Link>
              </div>
            </div>
          ) : student === "approved" ? (
            <StatusBox title="学割が適用されています">
              {freeAccess
                ? "有料プランが始まったら、学割価格でお申し込みいただけます。"
                : `料金プランのページから、月額 ${yen(PLANS.student.amount)} でお申し込みいただけます。`}
              {!freeAccess && (
                <Link href="/pricing" className="mt-4 inline-block text-sm text-accent hover:underline">
                  料金プランへ →
                </Link>
              )}
            </StatusBox>
          ) : student === "requested" ? (
            <StatusBox title={requested ? "学割の申請を受け付けました" : "学割を確認中です"}>
              運営が学生であることを確認しています。確認が終わるとメールでお知らせします。
            </StatusBox>
          ) : (
            <div className="rounded-[4px] border border-line p-6">
              <h2 className="font-semibold">学割を申請する</h2>
              <p className="mt-2 text-sm text-muted">
                <Jp>登録済みの方はこちらから申請できます。運営の確認後、学割価格に切り替わります。</Jp>
              </p>
              <form action={requestStudentAction} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="school" className="block text-sm font-medium">
                    学校名・学年
                  </label>
                  <input
                    id="school"
                    name="school"
                    required
                    maxLength={100}
                    placeholder="例：〇〇医療専門学校 理学療法学科 2年"
                    className="mt-1 w-full rounded-[4px] border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                  {schoolError && <p className="mt-1 text-sm text-red-600">学校名・学年を入力してください</p>}
                </div>
                <SubmitButton
                  pendingLabel="送信中…"
                  className="rounded-[4px] bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
                >
                  学割を申請する
                </SubmitButton>
              </form>
            </div>
          )}

          <div className="mt-10 space-y-1.5 text-xs leading-relaxed text-muted">
            <p>
              <Jp>対象は、医療系の大学・短大・専門学校に在学中の方です。</Jp>
            </p>
            <p>
              <Jp>確認のため、学生証などをお願いすることがあります。</Jp>
            </p>
            <p>
              <Jp>{`卒業後（3月末）はスタンダードプラン（月額 ${yen(pricing.standard.amount)}）に切り替わります。切り替えは次回の更新分からです。`}</Jp>
            </p>
            <p>
              <Jp>解約はマイページからいつでも行えます。</Jp>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function StatusBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div role="status" className="rounded-[4px] border border-accent/50 bg-accent/5 p-6">
      <p className="font-semibold">{title}</p>
      <div className="mt-2 text-sm text-muted">{children}</div>
    </div>
  );
}
