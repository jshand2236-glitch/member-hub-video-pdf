import Link from "next/link";
import { auth } from "@/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { isFreeAccessMode } from "@/lib/access";
import { INSTRUCTORS } from "@/data/instructors";

export default async function Home() {
  const session = await auth();
  const freeAccess = isFreeAccessMode();
  const isSubscribed = session?.user?.id
    ? await hasActiveSubscription(session.user.id)
    : false;
  const canViewContent = freeAccess || isSubscribed;

  const primaryHref = session?.user
    ? canViewContent
      ? "/dashboard"
      : "/pricing"
    : "/register";
  const primaryLabel = session?.user
    ? canViewContent
      ? "マイページへ"
      : "プランに登録する"
    : "会員登録して始める";

  return (
    <>
      {/* ヒーロー */}
      <section className="relative overflow-hidden bg-[linear-gradient(100deg,#001e50_0%,#00306f_46%,#004098_100%)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.6) 0, transparent 45%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.35) 0, transparent 40%)",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto flex min-h-[74vh] max-w-5xl flex-col justify-center px-4 py-24 sm:px-6">
          <span className="eyebrow eyebrow-light">AAM Fukuoka Members</span>
          <h1 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-5xl sm:leading-[1.45]">
            医療者として、
            <br />
            学び続ける場所。
          </h1>
          <p className="mt-8 max-w-xl text-sm leading-loose text-white/80 sm:text-base">
            現場で使える技術を届ける「動画講義」と、繰り返し学び直せる「資料PDF」。
            <br className="hidden sm:block" />
            福岡の医療者が学び続けるための環境が、ここにあります。
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href={primaryHref} className="btn bg-white text-navy hover:bg-white/90">
              {primaryLabel}
            </Link>
            <Link href="/instructors" className="btn btn-light">
              講師を見る
            </Link>
          </div>
          <p className="mt-16 font-sans text-[10px] tracking-[0.3em] text-white/60">
            SCROLL ↓
          </p>
        </div>
      </section>

      {/* 2つの学び方 */}
      <section className="bg-soft">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-24">
          <span className="eyebrow">Two ways to learn</span>
          <h2 className="mt-4 font-serif text-2xl font-semibold sm:text-3xl">
            観て学ぶ。読んで、深める。
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-loose text-muted">
            目的に合わせて、学び方を選べます。どちらも会員登録だけでご利用いただけます。
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="flex flex-col border border-line bg-background p-8">
              <span className="eyebrow">Video</span>
              <h3 className="mt-3 font-serif text-xl font-semibold">会員限定動画</h3>
              <p className="mt-4 flex-1 text-sm leading-loose text-muted">
                3名の講師が持ち回りで、臨床にそのまま活かせる技術と考え方を配信。
                講師ごとに整理されているので、学びたいテーマからすぐに辿り着けます。
              </p>
              <Link
                href={canViewContent ? "/videos" : "/register"}
                className="mt-8 font-sans text-xs tracking-[0.18em] text-accent hover:underline"
              >
                動画を見る →
              </Link>
            </div>

            <div className="flex flex-col border border-line bg-background p-8">
              <span className="eyebrow">Document</span>
              <h3 className="mt-3 font-serif text-xl font-semibold">資料PDF</h3>
              <p className="mt-4 flex-1 text-sm leading-loose text-muted">
                講義で使用した資料やまとめノートを会員限定で公開。
                ブラウザ上でそのまま閲覧でき、現場での確認にも使えます。
              </p>
              <Link
                href={canViewContent ? "/pdfs" : "/register"}
                className="mt-8 font-sans text-xs tracking-[0.18em] text-accent hover:underline"
              >
                資料を見る →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* コンセプト */}
      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-24">
          <span className="eyebrow">What is AAM Fukuoka</span>
          <h2 className="mt-4 font-serif text-2xl font-semibold sm:text-3xl">
            学びを、行動へ。
            <br />
            行動を、医療の未来へ。
          </h2>
          <p className="mt-8 text-sm leading-loose text-muted">
            技術は、受け取って終わりではありません。
            学び続けた人だけが、目の前の患者様を変えられる。
            職種や経験の垣根を越えて学び合う医療者のために、
            動画と資料をひとつの場所にまとめました。
          </p>
        </div>
      </section>

      {/* 講師 */}
      <section className="bg-deep">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-24">
          <span className="eyebrow">Instructors</span>
          <h2 className="mt-4 font-serif text-2xl font-semibold sm:text-3xl">
            配信するのは、この3名。
          </h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {INSTRUCTORS.map((instructor) => (
              <Link
                key={instructor.slug}
                href={`/instructors#${instructor.slug}`}
                className="border border-line bg-background p-6 transition hover:border-accent"
              >
                <span className="font-sans text-[10px] tracking-[0.28em] text-muted">
                  {instructor.nameReading}
                </span>
                <h3 className="mt-2 font-serif text-lg font-semibold">{instructor.name}</h3>
                <p className="mt-3 text-xs leading-relaxed text-muted">{instructor.title}</p>
                <p className="mt-1 text-xs text-muted">専門：{instructor.specialty}</p>
              </Link>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/instructors"
              className="font-sans text-xs tracking-[0.18em] text-accent hover:underline"
            >
              講師紹介を見る →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[linear-gradient(100deg,#001e50_0%,#004098_100%)]">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <span className="eyebrow eyebrow-light">Join us</span>
          <h2 className="mt-4 font-serif text-2xl font-semibold text-white sm:text-3xl">
            学び続ける医療者へ。
          </h2>
          <p className="mt-6 text-sm leading-loose text-white/80">
            {freeAccess
              ? "会員登録すると、限定公開の動画と資料PDFをすべてご覧いただけます。"
              : "月額プランに登録すると、限定公開の動画と資料PDFをすべてご覧いただけます。"}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href={primaryHref} className="btn bg-white text-navy hover:bg-white/90">
              {primaryLabel}
            </Link>
            {!session?.user && (
              <Link href="/login" className="btn btn-light">
                ログイン
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
