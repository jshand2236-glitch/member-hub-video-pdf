import Link from "next/link";
import type { pdfDocuments, videos } from "@/db/schema";
import { BODY_PARTS, UNCATEGORIZED, findBodyPart } from "@/data/body-parts";
import { deletePdfAction, deleteVideoAction, movePdfAction, moveVideoAction } from "./actions";

// Admin lists for videos and PDFs, grouped exactly the way members see them
// (videos by body part; PDFs by body part, then condition), with ↑↓ buttons
// to change the order inside each group.

type Video = typeof videos.$inferSelect;
type Doc = typeof pdfDocuments.$inferSelect;
const NO_DISEASE = "その他の資料";

function byPart<T extends { bodyPart: string | null }>(items: T[]) {
  return [
    ...BODY_PARTS.map((p) => ({ slug: p.slug, label: p.label, items: items.filter((i) => i.bodyPart === p.slug) })),
    {
      slug: UNCATEGORIZED.slug,
      label: UNCATEGORIZED.label,
      items: items.filter((i) => !findBodyPart(i.bodyPart)),
    },
  ].filter((g) => g.items.length > 0);
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
          <button
            type="submit"
            disabled={dir === "up" ? index === 0 : index === count - 1}
            aria-label={`「${title}」を${dir === "up" ? "上" : "下"}へ移動`}
            title={dir === "up" ? "上へ" : "下へ"}
            className={base}
          >
            {dir === "up" ? "↑" : "↓"}
          </button>
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
        <p className="font-medium leading-snug">{title}</p>
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
          <button type="submit" className="text-xs text-red-600 hover:underline">
            削除
          </button>
        </form>
      </div>
    </li>
  );
}

export function VideoAdminList({ videos }: { videos: Video[] }) {
  if (videos.length === 0) return <p className="mt-8 text-sm text-muted">まだ動画がありません。</p>;
  return (
    <div className="mt-10">
      <h3 className="text-base font-semibold">登録済みの動画（{videos.length}本）</h3>
      <p className="mt-1 text-xs text-muted">
        会員ページと同じく部位ごとに並んでいます。↑↓ で部位の中での表示順を入れ替えられます。新しく追加した動画はその部位の最後に入ります。
      </p>
      <div className="mt-5 space-y-6">
        {byPart(videos).map((g) => (
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
                  meta={[v.instructorName, v.provider === "youtube" ? "YouTube" : "Vimeo"].filter(Boolean).join(" / ")}
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

export function PdfAdminList({ docs }: { docs: Doc[] }) {
  if (docs.length === 0) return <p className="mt-8 text-sm text-muted">まだ資料がありません。</p>;
  return (
    <div className="mt-10">
      <h3 className="text-base font-semibold">登録済みの資料（{docs.length}件）</h3>
      <p className="mt-1 text-xs text-muted">
        会員ページと同じく部位・疾患ごとに並んでいます。↑↓ で疾患の中での表示順を入れ替えられます。新しく追加した資料はその疾患の最後に入ります。
      </p>
      <div className="mt-5 space-y-6">
        {byPart(docs).map((g) => (
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
