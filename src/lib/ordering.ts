import { and, asc, eq, isNull, max, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { pdfDocuments, videos } from "@/db/schema";

/**
 * Display order for videos and PDFs.
 *
 * Members see videos grouped by body part, and PDFs grouped by body part and
 * then condition (disease), so order only matters inside those groups. Admins
 * move items up/down within their group instead of typing sort numbers; new
 * items (and items moved into another group) go to the end of their group.
 */

export type Direction = "up" | "down";

function videoGroup(bodyPart: string | null): SQL {
  return bodyPart ? eq(videos.bodyPart, bodyPart) : isNull(videos.bodyPart);
}

function pdfGroup(bodyPart: string | null, disease: string | null): SQL {
  return and(
    bodyPart ? eq(pdfDocuments.bodyPart, bodyPart) : isNull(pdfDocuments.bodyPart),
    disease ? eq(pdfDocuments.disease, disease) : isNull(pdfDocuments.disease),
  )!;
}

export async function nextVideoSortOrder(bodyPart: string | null) {
  const [row] = await db.select({ m: max(videos.sortOrder) }).from(videos).where(videoGroup(bodyPart));
  return row?.m == null ? 0 : row.m + 1;
}

export async function nextPdfSortOrder(bodyPart: string | null, disease: string | null) {
  const [row] = await db
    .select({ m: max(pdfDocuments.sortOrder) })
    .from(pdfDocuments)
    .where(pdfGroup(bodyPart, disease));
  return row?.m == null ? 0 : row.m + 1;
}

/** Swaps an item with its neighbour, renumbering the group 0..n-1 so ties can't stick. */
function reorder(ids: string[], id: string, direction: Direction): string[] | null {
  const i = ids.indexOf(id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i === -1 || j < 0 || j >= ids.length) return null;
  const next = [...ids];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export async function moveVideo(id: string, direction: Direction) {
  const [item] = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  if (!item) return;
  const siblings = await db
    .select({ id: videos.id })
    .from(videos)
    .where(videoGroup(item.bodyPart))
    .orderBy(asc(videos.sortOrder), asc(videos.createdAt));
  const order = reorder(
    siblings.map((s) => s.id),
    id,
    direction,
  );
  if (!order) return;
  await db.transaction(async (tx) => {
    for (const [index, siblingId] of order.entries()) {
      await tx.update(videos).set({ sortOrder: index }).where(eq(videos.id, siblingId));
    }
  });
}

export async function movePdf(id: string, direction: Direction) {
  const [item] = await db.select().from(pdfDocuments).where(eq(pdfDocuments.id, id)).limit(1);
  if (!item) return;
  const siblings = await db
    .select({ id: pdfDocuments.id })
    .from(pdfDocuments)
    .where(pdfGroup(item.bodyPart, item.disease))
    .orderBy(asc(pdfDocuments.sortOrder), asc(pdfDocuments.createdAt));
  const order = reorder(
    siblings.map((s) => s.id),
    id,
    direction,
  );
  if (!order) return;
  await db.transaction(async (tx) => {
    for (const [index, siblingId] of order.entries()) {
      await tx.update(pdfDocuments).set({ sortOrder: index }).where(eq(pdfDocuments.id, siblingId));
    }
  });
}
