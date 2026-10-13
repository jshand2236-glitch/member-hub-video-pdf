"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { db } from "@/db";
import { videos, pdfDocuments, users, events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deletePdf, storedPdfKeyFromUrl } from "@/lib/pdf-storage";
import { isBodyPartSlug } from "@/data/body-parts";
import { isMemberStatus } from "@/lib/member-status";
import { parseVideoInput } from "@/lib/video-id";
import { movePdf, moveVideo, nextPdfSortOrder, nextVideoSortOrder, type Direction } from "@/lib/ordering";
import { queueApprovedEmail } from "@/lib/welcome-email";

async function assertAdmin() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    throw new Error("管理者権限がありません");
  }
}

async function eventExists(id: string) {
  const [row] = await db.select({ id: events.id }).from(events).where(eq(events.id, id)).limit(1);
  return !!row;
}

/** Reads the video form fields shared by the add and edit forms. */
function readVideoForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const description = String(formData.get("description") ?? "").trim().slice(0, 2000);
  const instructorName = String(formData.get("instructorName") ?? "").trim().slice(0, 100);
  const bodyPartRaw = String(formData.get("bodyPart") ?? "");
  const providerRaw = String(formData.get("provider") ?? "youtube");
  const videoInput = String(formData.get("providerVideoId") ?? "");
  const embedHashRaw = String(formData.get("embedHash") ?? "").trim();
  const eventIdRaw = String(formData.get("eventId") ?? "").trim();
  // Accept a full YouTube/Vimeo URL as well as a bare video ID.
  const parsed = parseVideoInput(videoInput, providerRaw);
  if (!title || !parsed) return null;

  return {
    title,
    description: description || null,
    instructorName: instructorName || null,
    bodyPart: isBodyPartSlug(bodyPartRaw) ? bodyPartRaw : null,
    provider: parsed.provider,
    providerVideoId: parsed.id,
    embedHash: parsed.provider === "vimeo" ? embedHashRaw || parsed.hash || null : null,
    eventId: eventIdRaw || null,
  };
}

export async function addVideoAction(formData: FormData) {
  await assertAdmin();
  const values = readVideoForm(formData);
  if (!values) redirect("/admin?videoError=1#videos");
  if (values.eventId && !(await eventExists(values.eventId))) values.eventId = null;
  // New videos go to the end of their body-part group.
  await db.insert(videos).values({ ...values, sortOrder: await nextVideoSortOrder(values.bodyPart) });
  revalidatePath("/admin");
  revalidatePath("/videos");
}

export async function updateVideoAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const values = readVideoForm(formData);
  if (!values) redirect(`/admin/videos/${id}?error=1`);
  if (values.eventId && !(await eventExists(values.eventId))) values.eventId = null;
  const [current] = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  if (!current) return;
  // Moved to another body part: put it at the end of that group.
  const sortOrder =
    current.bodyPart === values.bodyPart ? current.sortOrder : await nextVideoSortOrder(values.bodyPart);
  await db.update(videos).set({ ...values, sortOrder }).where(eq(videos.id, id));
  revalidatePath("/admin");
  revalidatePath("/videos");
  revalidatePath(`/videos/${id}`);
  redirect(`/admin/videos/${id}?saved=1`);
}

export async function deleteVideoAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.delete(videos).where(eq(videos.id, id));
  revalidatePath("/admin");
  revalidatePath("/videos");
}

export async function updatePdfAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const description = String(formData.get("description") ?? "").trim().slice(0, 2000);
  const bodyPartRaw = String(formData.get("bodyPart") ?? "");
  const disease = String(formData.get("disease") ?? "").trim().slice(0, 100);
  if (!id || !title) {
    throw new Error("タイトルは必須です");
  }
  const bodyPart = isBodyPartSlug(bodyPartRaw) ? bodyPartRaw : null;
  const [current] = await db.select().from(pdfDocuments).where(eq(pdfDocuments.id, id)).limit(1);
  if (!current) return;
  // Moved to another part/condition: put it at the end of that group.
  const sameGroup = current.bodyPart === bodyPart && (current.disease ?? null) === (disease || null);
  const sortOrder = sameGroup ? current.sortOrder : await nextPdfSortOrder(bodyPart, disease || null);
  await db
    .update(pdfDocuments)
    .set({ title, description: description || null, bodyPart, disease: disease || null, sortOrder })
    .where(eq(pdfDocuments.id, id));
  revalidatePath("/admin");
  revalidatePath("/pdfs");
  revalidatePath(`/pdfs/${id}`);
  redirect(`/admin/pdfs/${id}?saved=1`);
}

export async function deletePdfAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const [doc] = await db.select().from(pdfDocuments).where(eq(pdfDocuments.id, id)).limit(1);
  await db.delete(pdfDocuments).where(eq(pdfDocuments.id, id));
  // Also remove the file itself if it was uploaded into our private storage.
  const key = doc ? storedPdfKeyFromUrl(doc.url) : null;
  if (key) await deletePdf(key);
  revalidatePath("/admin");
  revalidatePath("/pdfs");
}

export async function setMemberStatusAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !isMemberStatus(status)) return;

  const [member] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!member || member.status === status) return;

  await db
    .update(users)
    .set({
      status,
      approvedAt: status === "approved" ? new Date() : member.approvedAt,
    })
    .where(eq(users.id, id));

  // Let the member know the first time they are approved.
  if (status === "approved" && !member.approvedAt) {
    queueApprovedEmail({ email: member.email, name: member.name });
  }
  revalidatePath("/admin");
}

function readDirection(formData: FormData): Direction | null {
  const dir = String(formData.get("dir") ?? "");
  return dir === "up" || dir === "down" ? dir : null;
}

export async function moveVideoAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const dir = readDirection(formData);
  if (!id || !dir) return;
  await moveVideo(id, dir);
  revalidatePath("/admin");
  revalidatePath("/videos");
}

export async function movePdfAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const dir = readDirection(formData);
  if (!id || !dir) return;
  await movePdf(id, dir);
  revalidatePath("/admin");
  revalidatePath("/pdfs");
}

/** Reads the 医療者交流会 form shared by the add and edit forms; null if invalid. */
function readEventForm(formData: FormData) {
  const str = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max);
  const title = str("title", 100) || "医療者交流会";
  const eventDate = str("eventDate", 10);
  const time = (v: string) => (/^\d{1,2}:\d{2}$/.test(v) ? v : null);
  const applyUrl = str("applyUrl", 500);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return null;
  if (applyUrl && !/^https?:\/\//i.test(applyUrl)) return null;
  return {
    title,
    eventDate,
    startTime: time(str("startTime", 5)),
    endTime: time(str("endTime", 5)),
    venue: str("venue", 200) || null,
    description: str("description", 2000) || null,
    applyUrl: applyUrl || null,
  };
}

export async function addEventAction(formData: FormData) {
  await assertAdmin();
  const values = readEventForm(formData);
  if (!values) redirect("/admin?eventError=1#events");
  await db.insert(events).values(values);
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function updateEventAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const values = readEventForm(formData);
  if (!values) redirect(`/admin/events/${id}?error=1`);
  await db.update(events).set(values).where(eq(events.id, id));
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect(`/admin/events/${id}?saved=1`);
}

export async function deleteEventAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.delete(events).where(eq(events.id, id));
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}
