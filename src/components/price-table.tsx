import Link from "next/link";
import type { ReactNode } from "react";
import Jp from "@/components/jp";
import { PLANS, yen, type PlanKey } from "@/lib/plans";

const BASE_CONTENTS = "講師3名の動画講義・資料PDF・医療者交流会のアーカイブを、すべてご覧いただけます。";

const CARD: Record<PlanKey, { target: string; contents: string; note?: string }> = {
  standard: { target: "医療従事者の方", contents: BASE_CONTENTS },
  early: {
    target: "医療者交流会の限定ご案内からご登録の方",
    contents: BASE_CONTENTS,
    note: "解約するまで、ずっとこの料金でご利用いただけます。",
  },
  student: {
    target: "医療系の大学・短大・専門学校に在学中の方",
    contents: BASE_CONTENTS,
    note: "卒業後（3月末）はスタンダードプランの料金に切り替わります。",
  },
  premium: {
    target: "もっと深く学びたい医療従事者の方",
    contents: "基本プランの内容すべてに加えて、プレミアム限定の動画をご覧いただけます。",
  },
};

/**
 * 料金表。基本プラン（その人に当てはまる料金）とプレミアムプランを縦に並べる。
 * 交流会当日入会・学割は、当てはまる人にだけ基本プランとして表示する。
 *
 * - base: 基本プランとして見せる料金（未ログインなら standard）
 * - action: 各カードの下に置くボタン。未指定なら「入会はこちら」（会員登録へ）
 * - current: 「あなたの料金」の印を付けるか
 */
export default function PriceTable({
  base = "standard",
  action,
  current = false,
}: {
  base?: PlanKey;
  action?: (key: PlanKey) => ReactNode;
  current?: boolean;
}) {
  const keys: PlanKey[] = [base, "premium"];
  return (
    <div className="mx-auto max-w-xl space-y-6">
      {keys.map((key) => {
        const plan = PLANS[key];
        const card = CARD[key];
        const premium = key === "premium";
        return (
          <div
            key={key}
            className={`rounded-[4px] border bg-background p-5 shadow-[0_4px_14px_rgba(14,27,52,0.08)] sm:p-6 ${
              premium ? "border-navy-deep/30" : "border-line"
            }`}
          >
            <h3 className="text-center font-serif text-lg font-semibold">
              {plan.name}
              {current && !premium && (
                <span className="ml-2 rounded-full bg-accent px-2 py-0.5 align-middle font-sans text-[11px] font-medium text-white">
                  あなたの料金
                </span>
              )}
            </h3>

            <dl className="mt-4 overflow-hidden rounded-[3px] border border-line text-sm">
              <dt className="bg-soft px-3 py-1.5 text-xs font-semibold">会費</dt>
              <dd className="border-t border-line px-3 py-2">
                <span className="text-xl font-bold">{`月額 ${yen(plan.amount)}`}</span>
                <span className="ml-1 text-xs text-muted">（税込）</span>
                {key !== "standard" && !premium && (
                  <span className="ml-2 text-xs text-muted line-through">{yen(PLANS.standard.amount)}</span>
                )}
              </dd>
              <dt className="border-t border-line bg-soft px-3 py-1.5 text-xs font-semibold">対象</dt>
              <dd className="border-t border-line px-3 py-2 leading-relaxed">
                <Jp>{card.target}</Jp>
              </dd>
              <dt className="border-t border-line bg-soft px-3 py-1.5 text-xs font-semibold">内容</dt>
              <dd className="border-t border-line px-3 py-2 leading-relaxed">
                <Jp>{card.contents}</Jp>
                {card.note && (
                  <span className="mt-1.5 block text-xs text-muted">
                    <Jp>{card.note}</Jp>
                  </span>
                )}
              </dd>
            </dl>

            <div className="mt-5">
              {action ? (
                action(key)
              ) : (
                <Link href="/register" className={`btn w-full !px-4 ${premium ? "btn-outline" : "btn-primary"}`}>
                  {premium ? "プレミアムで入会する" : "入会はこちら"}
                </Link>
              )}
            </div>
          </div>
        );
      })}

      {base === "standard" && (
        <p className="text-center text-sm">
          <Link href="/student" className="text-accent hover:underline">
            {`学生の方は学割プラン（月額 ${yen(PLANS.student.amount)}）があります →`}
          </Link>
        </p>
      )}
    </div>
  );
}

/** 料金表の下に置く「決済サイクル・入会・プラン変更」の説明。 */
export function PricingInfo({ showJoin }: { showJoin: boolean }) {
  return (
    <div className="mt-14 space-y-12">
      <InfoBlock title="会費の決済サイクルについて">
        <p>
          <Jp>いずれのプランも月額制です。お申し込み日に初回の会費をお支払いいただき、以後1か月ごとに自動で更新されます。</Jp>
        </p>
        <p>
          <Jp>お支払いはクレジットカード（Stripe）です。料金はお申し込み時のプランのまま、解約するまで変わりません。</Jp>
        </p>
      </InfoBlock>

      <InfoBlock title="入会について">
        <p>
          <Jp>会員登録（無料）のあと、運営がご登録内容を確認します。承認のメールが届いたら、料金プランにお申し込みいただけます。</Jp>
        </p>
        {showJoin && (
          <div className="pt-3">
            <Link href="/register" className="btn btn-primary w-full max-w-sm">
              入会はこちら
            </Link>
          </div>
        )}
      </InfoBlock>

      <InfoBlock title="プランの変更・解約について">
        <p>
          <Jp>プランの変更（基本プランとプレミアムプランの切り替え）をご希望の方は、運営までご連絡ください。</Jp>
        </p>
        <p>
          <Jp>入会後に学生であることが分かった場合は、学生向けページから学割を申請できます。運営の確認後、次回の更新分から学割料金に切り替わります。</Jp>
        </p>
        <p>
          <Jp>解約はマイページの「お支払い情報・解約」からいつでも行えます。解約後も、お支払い済みの期間の終わりまではご利用いただけます。日割りでの返金はありません。</Jp>
        </p>
        <div className="pt-3">
          <Link href="/student" className="btn btn-outline w-full max-w-sm">
            学割の申請はこちら
          </Link>
        </div>
      </InfoBlock>
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="text-center">
      <h2 className="inline-block border-b-2 border-accent pb-2 font-serif text-xl font-semibold">{title}</h2>
      <div className="mx-auto mt-5 max-w-xl space-y-2 text-sm leading-loose text-muted">{children}</div>
    </section>
  );
}
