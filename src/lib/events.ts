import { asc, desc, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";

export type EventRow = typeof events.$inferSelect;

/** Today's date in Japan as "YYYY-MM-DD" (events are stored as Japan-time dates). */
export function todayInJapan(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
}

/** "2026-11-15" -> "2026年11月15日（日）" */
export function formatEventDate(eventDate: string): string {
  const d = new Date(`${eventDate}T00:00:00+09:00`);
  const ymd = d.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "long", day: "numeric" });
  const wd = d.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", weekday: "short" });
  return `${ymd}（${wd}）`;
}

export function formatEventTime(e: Pick<EventRow, "startTime" | "endTime">): string | null {
  if (e.startTime && e.endTime) return `${e.startTime}〜${e.endTime}`;
  if (e.startTime) return `${e.startTime}〜`;
  return null;
}

/** Days from today (Japan time) until the event: 0 = today. */
export function daysUntil(eventDate: string): number {
  const ms = Date.parse(`${eventDate}T00:00:00Z`) - Date.parse(`${todayInJapan()}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export async function getUpcomingEvents(limit = 4) {
  return db
    .select()
    .from(events)
    .where(gte(events.eventDate, todayInJapan()))
    .orderBy(asc(events.eventDate), asc(events.startTime))
    .limit(limit);
}

export async function getEventsForAdmin() {
  const today = todayInJapan();
  const [upcoming, past] = await Promise.all([
    db.select().from(events).where(gte(events.eventDate, today)).orderBy(asc(events.eventDate)),
    db.select().from(events).where(lt(events.eventDate, today)).orderBy(desc(events.eventDate)).limit(10),
  ]);
  return { upcoming, past };
}
