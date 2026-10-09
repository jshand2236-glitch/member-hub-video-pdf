// Browser-side helper shared by the "add PDF" and "replace PDF" forms.
// Uploads the file to /api/admin/pdf-upload in chunks (a single request to a
// Netlify Function is capped at ~6 MB) and returns what the /complete
// endpoint needs to finish the upload.

// Must match PDF_CHUNK_SIZE / PDF_MAX_PARTS in src/lib/pdf-storage.ts
const CHUNK_SIZE = 3 * 1024 * 1024;
const MAX_PARTS = 30;

export type UploadedPdf = { key: string; parts: number; size: number; filename: string };

/** Returns an error message, or null if the file can be uploaded. */
export function checkPdfFile(file: unknown): string | null {
  if (!(file instanceof File) || file.size === 0) return "PDFファイルを選択してください";
  if (file.type && file.type !== "application/pdf") return "PDFファイルのみアップロードできます";
  if (Math.ceil(file.size / CHUNK_SIZE) > MAX_PARTS) {
    return `ファイルが大きすぎます（上限 約${(CHUNK_SIZE * MAX_PARTS) / 1024 / 1024}MB）`;
  }
  return null;
}

export async function uploadPdfInChunks(
  file: File,
  onProgress: (percent: number) => void,
): Promise<UploadedPdf> {
  const key = crypto.randomUUID();
  const parts = Math.ceil(file.size / CHUNK_SIZE);
  for (let i = 0; i < parts; i++) {
    onProgress(Math.round((i / parts) * 100));
    const res = await fetch(`/api/admin/pdf-upload?key=${key}&part=${i}`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "アップロードに失敗しました");
  }
  onProgress(100);
  return { key, parts, size: file.size, filename: file.name };
}
