/**
 * 料金プラン（月額・税込）。実際の請求額は Stripe の Price で決まり、
 * ここの金額は表示用。Price の id は Netlify の環境変数で指定する。
 *
 *  - standard: 一般                          ¥3,980  STRIPE_PRICE_ID_STANDARD
 *  - early:    交流会当日入会（限定URLから登録）  ¥2,980  STRIPE_PRICE_ID_EARLY（未設定なら STRIPE_PRICE_ID）
 *  - student:  学割（運営が学生と確認した人）    ¥1,980  STRIPE_PRICE_ID_STUDENT
 *  - premium:  プレミアム（限定動画つき）        ¥9,800  STRIPE_PRICE_ID_PREMIUM
 *
 * standard / early / student は同じ内容で料金だけが違う（その人に当てはまる1つに自動で決まる）。
 * premium はそれに加えて「プレミアム限定」の動画も見られる上位プラン（誰でも選べる）。
 *
 * 一度申し込んだ人の料金は、解約するまでその価格のまま（Stripe の仕様）。
 */
export type PlanKey = "standard" | "early" | "student" | "premium";

export const PLANS: Record<PlanKey, { name: string; amount: number }> = {
  standard: { name: "スタンダードプラン", amount: 3980 },
  early: { name: "交流会当日入会プラン", amount: 2980 },
  student: { name: "学割プラン", amount: 1980 },
  premium: { name: "プレミアムプラン", amount: 9800 },
};

/** 限定URL（/join/<コード>）から登録した人に付く印。users.offer に保存。 */
export const EARLY_OFFER = "early";

/** 当日入会の限定URLのコード。EARLY_JOIN_CODE が未設定なら限定URLは使えない。 */
export function earlyJoinCode(): string | null {
  const c = (process.env.EARLY_JOIN_CODE ?? "").trim();
  return c.length >= 6 ? c : null;
}

/** 交流会当日入会の日（日本時間）。EARLY_BIRD_DATE=2026-12-06 のように変更できる。 */
export function earlyBirdDate(): string {
  return process.env.EARLY_BIRD_DATE || "2026-12-06";
}

export function todayInJapan(now = new Date()): string {
  return new Date(now.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

export function isEarlyBirdDay(now = new Date()): boolean {
  return todayInJapan(now) === earlyBirdDate();
}

/** 基本プラン（standard / early / student）のうち、その人に当てはまる料金。 */
export function planFor(user: { student: string | null; offer?: string | null } | null): PlanKey {
  if (user?.student === "approved") return "student";
  if (user?.offer === EARLY_OFFER) return "early";
  return "standard";
}

export function priceIdFor(plan: PlanKey): string | undefined {
  switch (plan) {
    case "student":
      return process.env.STRIPE_PRICE_ID_STUDENT;
    case "premium":
      return process.env.STRIPE_PRICE_ID_PREMIUM;
    case "early":
      return process.env.STRIPE_PRICE_ID_EARLY || process.env.STRIPE_PRICE_ID;
    default:
      return process.env.STRIPE_PRICE_ID_STANDARD;
  }
}

export function yen(n: number): string {
  return `¥${n.toLocaleString("ja-JP")}`;
}

/** "月額 ¥3,980（税込）" */
export function priceLabel(plan: PlanKey): string {
  return `月額 ${yen(PLANS[plan].amount)}（税込）`;
}

/** "2026年12月6日（日）" */
export function formatJpDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00+09:00`);
  const wd = ["日", "月", "火", "水", "木", "金", "土"][new Date(d.getTime() + 9 * 3600 * 1000).getUTCDay()];
  const [y, m, day] = iso.split("-").map(Number);
  return `${y}年${m}月${day}日（${wd}）`;
}
