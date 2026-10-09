"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { db } from "@/db";
import { videos, pdfDocuments, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deletePdf, storedPdfKeyFromUrl } from "@/lib/pdf-storage";
import { isBodyPartSlug } from "@/data/body-parts";
import { isMemberStatus } from "@/lib/member-status";
import { parseVideoInput } from "@/lib/video-id";
import { queueApprovedEmail } from "@/lib/welcome-email";

async function assertAdmin() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    throw new Error("管理者権限がありません");
  }
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
  const sortOrder = Number.parseInt(String(formData.get("sortOrder") ?? "0"), 10) || 0;

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
    sortOrder,
  };
}

export async function addVideoAction(formData: FormData) {
  await assertAdmin();
  const values = readVideoForm(formData);
  if (!values) redirect("/admin?videoError=1#videos");
  await db.insert(videos).values(values);
  revalidatePath("/admin");
  revalidatePath("/videos");
}

export async function updateVideoAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const values = readVideoForm(formData);
  if (!values) redirect(`/admin/videos/${id}?error=1`);
  await db.update(videos).set(values).where(eq(videos.id, id));
  revalidatePath("/admin");
  revalidatePath("/videos");
  revalidatePath(`/videos/${id}`);
  redirect(`/admin/videos/${id}?saved=1`);
}

export async function updateVideoBodyPartAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const bodyPartRaw = String(formData.get("bodyPart") ?? "");
  if (!id) return;
  await db
    .update(videos)
    .set({ bodyPart: isBodyPartSlug(bodyPartRaw) ? bodyPartRaw : null })
    .where(eq(videos.id, id));
  revalidatePath("/admin");
  revalidatePath("/videos");
}

export async function deleteVideoAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.delete(videos).where(eq(videos.id, id));
  revalidatePath("/admin");
  revalidatePath("/videos");
}

export async function addPdfAction(formData: FormData) {
  await assertAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const sortOrderRaw = String(formData.get("sortOrder") ?? "0");

  if (!title || !url) {
    throw new Error("タイトルとURLは必須です");
  }

  await db.insert(pdfDocuments).values({
    title,
    description: description || null,
    url,
    sortOrder: Number.parseInt(sortOrderRaw, 10) || 0,
  });

  revalidatePath("/admin");
  revalidatePath("/pdfs");
}

export async function updatePdfMetaAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const bodyPartRaw = String(formData.get("bodyPart") ?? "");
  const disease = String(formData.get("disease") ?? "").trim();
  if (!id) return;
  await db
    .update(pdfDocuments)
    .set({
      bodyPart: isBodyPartSlug(bodyPartRaw) ? bodyPartRaw : null,
      disease: disease || null,
    })
    .where(eq(pdfDocuments.id, id));
  revalidatePath("/admin");
  revalidatePath("/pdfs");
}

export async function updatePdfAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const description = String(formData.get("description") ?? "").trim().slice(0, 2000);
  const bodyPartRaw = String(formData.get("bodyPart") ?? "");
  const disease = String(formData.get("disease") ?? "").trim().slice(0, 100);
  const sortOrder = Number.parseInt(String(formData.get("sortOrder") ?? "0"), 10) || 0;
  if (!id || !title) {
    throw new Error("タイトルは必須です");
  }
  await db
    .update(pdfDocuments)
    .set({
      title,
      description: description || null,
      bodyPart: isBodyPartSlug(bodyPartRaw) ? bodyPartRaw : null,
      disease: disease || null,
      sortOrder,
    })
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
