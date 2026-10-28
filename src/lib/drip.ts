import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions, users } from "@/db/schema";

/**
 * 入会日を基準に、動画を週ごとに解放する（ステップ配信）。
 *
 * - 入会日 = 会員承認日と、最初に有料プランを申し込んだ日の早い方。
 *   どちらもなければ登録日。
 * - unlockWeek = 1 は入会日から、2 は7日後、3 は14日後…（日本時間の0時に解放）。
 * - unlockWeek が空の動画は最初から見られる。管理者は常にすべて見られる。
 */
const DAY = 24 * 3600 * 1000;
const JST = 9 * 3600 * 1000;

export async function getMemberStart(userId: string): Promise<Date | null> {
  const [[firstSub], [user]] = await Promise.all([
    db
      .select({ createdAt: subscriptions.createdAt })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(asc(subscriptions.createdAt))
      .limit(1),
    db
      .select({ approvedAt: users.approvedAt, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
  ]);
  // 承認日と最初の申し込み日の早い方（無料公開中から使っていた会員は、課金開始後も続きから）
  const candidates = [firstSub?.createdAt, user?.approvedAt].filter((d): d is Date => !!d);
  if (candidates.length === 0) return user?.createdAt ?? null;
  return new Date(Math.min(...candidates.map((d) => d.getTime())));
}

/** 入会日（日本時間の日付の0時）から (week-1) 週後の日本時間0時。 */
export function unlockDate(start: Date, week: number): Date {
  const startDayJst = Math.floor((start.getTime() + JST) / DAY) * DAY - JST;
  return new Date(startDayJst + Math.max(0, week - 1) * 7 * DAY);
}

export type Lock = { locked: false } | { locked: true; unlocksAt: Date; daysLeft: number };

export function lockState(
  unlockWeek: number | null | undefined,
  start: Date | null,
  opts: { isAdmin?: boolean; now?: Date } = {},
): Lock {
  if (opts.isAdmin || !unlockWeek || unlockWeek <= 1 || !start) return { locked: false };
  const now = opts.now ?? new Date();
  const at = unlockDate(start, unlockWeek);
  if (at.getTime() <= now.getTime()) return { locked: false };
  return { locked: true, unlocksAt: at, daysLeft: Math.ceil((at.getTime() - now.getTime()) / DAY) };
}

const WD = ["日", "月", "火", "水", "木", "金", "土"];
/** "11/14(土)" */
export function formatUnlockDate(d: Date): string {
  const j = new Date(d.getTime() + JST);
  return `${j.getUTCMonth() + 1}/${j.getUTCDate()}(${WD[j.getUTCDay()]})`;
}
