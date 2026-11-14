/**
 * Controls whether members need an active paid subscription to view gated
 * content (videos / PDFs), or whether registering + logging in is enough on
 * its own.
 *
 * FREE_ACCESS_MODE=true のあいだは、会員登録（承認）だけで無料で見られる。
 * ただし PAID_START_DATE（日本時間・既定 2026-12-06）の0時になると、
 * 環境変数を変えたり再公開したりしなくても自動で有料に切り替わる。
 */
export function paidStartDate(): string {
  return process.env.PAID_START_DATE || "2026-12-06";
}

/** 有料開始の瞬間（日本時間の0時）。 */
export function paidStartAt(): Date {
  return new Date(`${paidStartDate()}T00:00:00+09:00`);
}

export function isFreeAccessMode(now = new Date()): boolean {
  if (process.env.FREE_ACCESS_MODE !== "true") return false;
  return now.getTime() < paidStartAt().getTime();
}

/** 「2026年12月6日（日）」 */
export function paidStartLabel(): string {
  const iso = paidStartDate();
  const [y, m, d] = iso.split("-").map(Number);
  const wd = ["日", "月", "火", "水", "木", "金", "土"][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${y}年${m}月${d}日（${wd}）`;
}
