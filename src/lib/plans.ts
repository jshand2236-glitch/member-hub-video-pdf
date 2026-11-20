/**
 * 料金プラン（月額・税込）。実際の請求額は Stripe の Price で決まる。
 *
 *  - founder:  期間限定プラン（2027年末までの申し込み） ¥980  STRIPE_PRICE_ID_FOUNDER
 *  - standard: 期間後の料金（管理画面で選ぶ。未設定なら ¥3,980 / STRIPE_PRICE_ID_STANDARD）
 *  - student:  学割（運営が学生と確認した人）  ¥1,980  STRIPE_PRICE_ID_STUDENT
 *  - premium:  プレミアム（限定動画つき）      ¥9,800  STRIPE_PRICE_ID_PREMIUM（いまは休止中：PREMIUM_ENABLED）
 *
 * founder / standard / student は同じ内容で料金だけが違う（その人に当てはまる1つに自動で決まる）。
 * premium はそれに加えて「プレミアム限定」の動画も見られる上位プラン（誰でも選べる）。
 * 一度申し込んだ人の料金は、解約するまでその価格のまま（Stripe の仕様）。
 * standard の金額は管理画面で変わるので、表示には src/lib/pricing.ts の getPricing() を使う。
 */
export type PlanKey = "founder" | "standard" | "student" | "premium";

export const PLANS: Record<PlanKey, { name: string; amount: number }> = {
  founder: { name: "期間限定プラン", amount: 980 },
  standard: { name: "スタンダードプラン", amount: 3980 },
  student: { name: "学割プラン", amount: 1980 },
  premium: { name: "プレミアムプラン", amount: 9800 },
};

/** プレミアムプランはひとまず休止。true にすると料金表・限定動画の機能が戻る。 */
export const PREMIUM_ENABLED = false;

/** 期間限定プランの締め切り日（日本時間・この日の23:59まで）。FOUNDER_END_DATE で変更できる。 */
export function founderEndDate(): string {
  return process.env.FOUNDER_END_DATE || "2027-12-31";
}

/** 締め切りの瞬間（締め切り日の翌日0時・日本時間）。 */
export function founderEndsAt(): Date {
  const d = new Date(`${founderEndDate()}T00:00:00+09:00`);
  return new Date(d.getTime() + 24 * 3600 * 1000);
}

/** 「2027年12月31日（金）」 */
export function founderEndLabel(): string {
  const [y, m, d] = founderEndDate().split("-").map(Number);
  const wd = ["日", "月", "火", "水", "木", "金", "土"][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${y}年${m}月${d}日（${wd}）`;
}

/** 環境変数で決まっている Price ID。standard は管理画面の設定が優先（pricing.ts）。 */
export function priceIdFor(plan: PlanKey): string | undefined {
  switch (plan) {
    case "student":
      return process.env.STRIPE_PRICE_ID_STUDENT;
    case "premium":
      return process.env.STRIPE_PRICE_ID_PREMIUM;
    case "founder":
      return process.env.STRIPE_PRICE_ID_FOUNDER;
    default:
      return process.env.STRIPE_PRICE_ID_STANDARD;
  }
}

export function yen(n: number): string {
  return `¥${n.toLocaleString("ja-JP")}`;
}


/** "2026年12月6日（日）" */
export function formatJpDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00+09:00`);
  const wd = ["日", "月", "火", "水", "木", "金", "土"][new Date(d.getTime() + 9 * 3600 * 1000).getUTCDay()];
  const [y, m, day] = iso.split("-").map(Number);
  return `${y}年${m}月${day}日（${wd}）`;
}
