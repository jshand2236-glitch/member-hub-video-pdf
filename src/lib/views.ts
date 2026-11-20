import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { contentViews } from "@/db/schema";

export type ViewKind = "video" | "pdf";

/** 動画・PDFを開いたことを記録する（2回目以降は何もしない）。 */
export async function recordView(userId: string, kind: ViewKind, contentId: string) {
  try {
    await db.insert(contentViews).values({ userId, kind, contentId }).onConflictDoNothing();
  } catch (err) {
    console.error("[views] failed to record", err);
  }
}

/** その会員が見たことのある動画／PDFのID。 */
export async function getViewedIds(userId: string, kind: ViewKind): Promise<Set<string>> {
  const rows = await db
    .select({ id: contentViews.contentId })
    .from(contentViews)
    .where(and(eq(contentViews.userId, userId), eq(contentViews.kind, kind)));
  return new Set(rows.map((r) => r.id));
}
