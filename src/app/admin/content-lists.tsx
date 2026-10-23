import Link from "next/link";
import type { pdfDocuments, videos } from "@/db/schema";
import { UNCATEGORIZED, findBodyPart } from "@/data/body-parts";
import { SEMINAR_SLUG, orderedBodyParts } from "@/lib/part-order";
import { formatEventDate, type EventRow } from "@/lib/events";
import { deletePdfAction, deleteVideoAction, movePdfAction, moveVideoAction } from "./actions";
import SubmitButton from "@/components/submit-button";
import { formatPublishAt, isPublished } from "@/lib/publish-format";

// Admin lists for videos and PDFs, grouped exactly the way members see them
// (videos by body part; PDFs by body part, then condition), with ↑↓ buttons
// to change the order inside each group.

type Video = typeof videos.$inferSelect;
type Doc = typeof pdfDocuments.$inferSelect;
const NO_DISEASE = "その他の資料";

/** Groups items by body part in the admin-chosen order. Items without a part
 * go to `other`, placed where the seminar entry sits in the order (videos) or
 * last (PDFs). */
function byPart<T extends { bodyPart: string | null }>(
  items: T[],
  order: string[],
  other: { label: string; atSeminarPosition: boolean } = { label: UNCATEGORIZED.label, atSeminarPosition: false },
) {
  const otherGroup = { slug: UNCATEGORIZED.slug, label: other.label, items: items.filter((i) => !findBodyPart(i.bodyPart)) };
  const parts = orderedBodyParts(order).map((p) => ({
    slug: p.slug,
    label: p.label,
    items: items.filter((i) => i.bodyPart === p.slug),
  }));
  const groups = other.atSeminarPosition
    ? order.map((s) => (s === SEMINAR_SLUG ? otherGroup : parts.find((g) => g.slug === s)!)).filter(Boolean)
    : [...parts, otherGroup];
  return groups.filter((g) => g.items.length > 0);
}

function byDisease(docs: Doc[]) {
  const map = new Map<string, Doc[]>();
  for (const d of docs) {
    const key = d.disease?.trim() || NO_DISEASE;
    map.set(key, [...(map.get(key) ?? []), d]);
  }
  // Same order as the member page: named conditions in Japanese order, catch-all last.
  return [...map.entries()].sort(([a], [b]) =>
    a === NO_DISEASE ? 1 : b === NO_DISEASE ? -1 : a.localeCompare(b, "ja"),
  );
}

function MoveButtons({
  id,
  index,
  count,
  action,
  title,
}: {
  id: string;
  index: number;
  count: number;
  action: (formData: FormData) => Promise<void>;
  title: string;
}) {
  const base =
    "flex h-7 w-7 items-center justify-center rounded-[4px] border border-line text-sm leading-none text-muted hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-25";
  return (
    <div className="flex shrink-0 gap-1">
      {(["up", "down"] as const).map((dir) => (
        <form key={dir} action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="dir" value={dir} />
          <SubmitButton
            pendingLabel="…"
            disabled={dir === "up" ? index === 0 : index === count - 1}
            aria-label={`「${title}」を${dir === "up" ? "上" : "下"}へ移動`}
            title={dir === "up" ? "上へ" : "下へ"}
            className={base}
          >
            {dir === "up" ? "↑" : "↓"}
          </SubmitButton>
        </form>
      ))}
    </div>
  );
}

function Row({
  index,
  count,
  id,
  title,
  meta,
  publishAt,
  editHref,
  editLabel,
  moveAction,
  deleteAction,
}: {
  index: number;
  count: number;
  id: string;
  title: string;
  meta: string;
  publishAt: Date | null;
  editHref: string;
  editLabel: string;
  moveAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-soft font-sans text-xs text-muted">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-snug">
          {!isPublished(publishAt) && publishAt && (
            <span className="mr-2 inline-block rounded-full bg-accent/15 px-2 py-0.5 align-middle font-sans text-[11px] font-medium text-accent">
              予約 {formatPublishAt(publishAt)} 公開
            </span>
          )}
          {title}
        </p>
        {meta && <p className="mt-0.5 line-clamp-1 text-xs text-muted">{meta}</p>}
      </div>
      <div className="flex items-center gap-3">
        {count > 1 && <MoveButtons id={id} index={index} count={count} action={moveAction} title={title} />}
        <Link
          href={editHref}
          className="rounded-[4px] border border-accent px-3 py-1 text-xs text-accent hover:bg-accent hover:text-white"
        >
          {editLabel}
        </Link>
        <form action={deleteAction}>
          <input type="hidden" name="id" value={id} />
          <SubmitButton
            pendingLabel="削除中…"
            confirmMessage={`「${title}」を削除します。元に戻せません。よろしいですか？`}
            className="text-xs text-red-600 hover:underline"
          >
            削除
          </SubmitButton>
        </form>
      </div>
    </li>
  );
}

export function VideoAdminList({ videos, events, order }: { videos: Video[]; events: EventRow[]; order: string[] }) {
  const eventLabel = (id: string | null) => {
    const e = id ? events.find((x) => x.id === id) : undefined;
    return e ? `交流会 ${formatEventDate(e.eventDate)}` : null;
  };
  if (videos.length === 0) return <p className="mt-8 text-sm text-muted">まだ動画がありません。</p>;
  return (
    <div className="mt-10">
      <h3 className="text-base font-semibold">登録済みの動画（{videos.length}本）</h3>
      <p className="mt-1 text-xs text-muted">
        会員ページと同じく部位ごとに並んでいます。↑↓ で部位の中での表示順を入れ替えられます。新しく追加した動画はその部位の最後に入ります。
      </p>
      <div className="mt-5 space-y-6">
        {byPart(videos, order, { label: "オフラインセミナー", atSeminarPosition: true }).map((g) => (
          <div key={g.slug}>
            <p className="flex items-center gap-2 border-b border-line pb-2 text-sm font-semibold">
              <span className="h-3.5 w-[3px] bg-accent" aria-hidden="true" />
              {g.label}
              <span className="font-sans text-xs font-normal text-muted">{g.items.length}本</span>
            </p>
            <ol className="divide-y divide-line">
              {g.items.map((v, i) => (
                <Row
                  key={v.id}
                  index={i}
                  count={g.items.length}
                  id={v.id}
                  title={v.title}
                  meta={[eventLabel(v.eventId), v.instructorName, v.provider === "youtube" ? "YouTube" : "Vimeo"]
                    .filter(Boolean)
                    .join(" / ")}
                  publishAt={v.publishAt}
                  editHref={`/admin/videos/${v.id}`}
                  editLabel="編集"
                  moveAction={moveVideoAction}
                  deleteAction={deleteVideoAction}
                />
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PdfAdminList({ docs, order }: { docs: Doc[]; order: string[] }) {
  if (docs.length === 0) return <p className="mt-8 text-sm text-muted">まだ資料がありません。</p>;
  return (
    <div className="mt-10">
      <h3 className="text-base font-semibold">登録済みの資料（{docs.length}件）</h3>
      <p className="mt-1 text-xs text-muted">
        会員ページと同じく部位・疾患ごとに並んでいます。↑↓ で疾患の中での表示順を入れ替えられます。新しく追加した資料はその疾患の最後に入ります。
      </p>
      <div className="mt-5 space-y-6">
        {byPart(docs, order).map((g) => (
          <div key={g.slug}>
            <p className="flex items-center gap-2 border-b border-line pb-2 text-sm font-semibold">
              <span className="h-3.5 w-[3px] bg-accent" aria-hidden="true" />
              {g.label}
              <span className="font-sans text-xs font-normal text-muted">{g.items.length}件</span>
            </p>
            {byDisease(g.items).map(([disease, items]) => (
              <div key={disease} className="mt-3 pl-4">
                <p className="text-xs font-semibold text-muted">{disease}</p>
                <ol className="divide-y divide-line">
                  {items.map((d, i) => (
                    <Row
                      key={d.id}
                      index={i}
                      count={items.length}
                      id={d.id}
                      title={d.title}
                      meta={d.description ?? ""}
                      publishAt={d.publishAt}
                      editHref={`/admin/pdfs/${d.id}`}
                      editLabel="編集・差し替え"
                      moveAction={movePdfAction}
                      deleteAction={deletePdfAction}
                    />
                  ))}
                </ol>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
