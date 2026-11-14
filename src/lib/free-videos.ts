import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { isPublishedSql } from "@/lib/publish";

/** 無料公開中（予約配信の公開日時を過ぎたもの）の動画。 */
export async function getFreeVideos(limit?: number) {
  const q = db
    .select()
    .from(videos)
    .where(and(eq(videos.isFree, true), isPublishedSql(videos.publishAt)))
    .orderBy(asc(videos.sortOrder), asc(videos.createdAt));
  return limit ? q.limit(limit) : q;
}

export async function getFreeVideo(id: string) {
  const [v] = await db
    .select()
    .from(videos)
    .where(and(eq(videos.id, id), eq(videos.isFree, true), isPublishedSql(videos.publishAt)))
    .limit(1);
  return v ?? null;
}
