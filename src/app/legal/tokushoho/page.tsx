import { SELLER } from "@/data/legal";
import { PRICE_LABEL, TRIAL_DAYS } from "@/lib/billing";
import Jp from "@/components/jp";

export const metadata = {
  title: "特定商取引法に基づく表記 | FMC",
};

export default function TokushohoPage() {
  const trial = TRIAL_DAYS > 0;
  const rows: [string, string][] = [
    ["販売事業者", SELLER.name],
    ["運営責任者", SELLER.representative],
    ["所在地", SELLER.address],
    ["電話番号", SELLER.phone],
    ["メールアドレス", SELLER.email],
    ["サービス名", "FUKUOKA MEDICAL CONNECT MEMBERS（会員制動画・資料配信サービス）"],
    ["販売価格", `スタンダードプラン ${PRICE_LABEL}`],
    ["商品代金以外の必要料金", "インターネット接続にかかる通信料はお客様のご負担となります。"],
    ["お支払い方法", "クレジットカード決済（Stripe）"],
    [
      "お支払い時期",
      trial
        ? `お申し込み時にカード情報をご登録いただき、以後1か月ごとに自動で決済されます。初めての方は${TRIAL_DAYS}日間の無料期間があり、無料期間の終了時に初回の決済が行われます。`
        : "お申し込み時に初回の決済が行われ、以後1か月ごとに自動で決済されます。",
    ],
    ["サービスの提供時期", "決済手続きの完了後、ただちにご利用いただけます。"],
    [
      "解約について",
      `マイページの「お支払い情報・解約」からいつでも解約できます。解約後も、お支払い済みの期間の終わりまでご利用いただけます。${trial ? "無料期間中に解約された場合、料金は発生しません。" : ""}`,
    ],
    [
      "返品・返金について",
      "デジタルコンテンツの性質上、お支払い済みの料金の返金および日割り計算による返金はいたしません。",
    ],
    ["動作環境", "最新版の Safari・Google Chrome・Microsoft Edge 等のブラウザ（PC・スマートフォン）"],
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <span className="eyebrow">Legal</span>
      <h1 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">特定商取引法に基づく表記</h1>
      <dl className="mt-10 divide-y divide-line border-y border-line text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 py-4 sm:grid-cols-[180px_1fr] sm:gap-6">
            <dt className="font-medium">{k}</dt>
            <dd className="leading-relaxed text-muted">
              <Jp>{v}</Jp>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
