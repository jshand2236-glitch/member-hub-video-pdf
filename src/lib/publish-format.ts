/** 予約配信の日時ヘルパー（クライアントでも使えるよう DB 依存なし）。日本時間で扱う。 */

export function isPublished(publishAt: Date | null | undefined, now = new Date()): boolean {
  return !publishAt || publishAt.getTime() <= now.getTime();
}

/** <input type="datetime-local"> の値（日本時間 "2026-10-30T18:00"）→ Date。空欄・不正なら null。 */
export function parsePublishAt(raw: FormDataEntryValue | string | null | undefined): Date | null {
  const v = String(raw ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const d = new Date(`${v}:00+09:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date → datetime-local の初期値（日本時間）。 */
export function toPublishInput(d: Date | null | undefined): string {
  if (!d) return "";
  const j = new Date(d.getTime() + 9 * 3600 * 1000);
  return j.toISOString().slice(0, 16);
}

const WD = ["日", "月", "火", "水", "木", "金", "土"];
/** 表示用: "10/30(金) 18:00" */
export function formatPublishAt(d: Date): string {
  const j = new Date(d.getTime() + 9 * 3600 * 1000);
  const hh = String(j.getUTCHours()).padStart(2, "0");
  const mm = String(j.getUTCMinutes()).padStart(2, "0");
  return `${j.getUTCFullYear()}/${j.getUTCMonth() + 1}/${j.getUTCDate()}(${WD[j.getUTCDay()]}) ${hh}:${mm}`;
}
