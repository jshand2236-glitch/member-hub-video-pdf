import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { requireActiveSubscriber } from "@/lib/require-subscriber";
import { db } from "@/db";
import { pdfDocuments, videos } from "@/db/schema";
import { findBodyPart } from "@/data/body-parts";
import { isAdminEmail } from "@/lib/admin";
import { formatPublishAt, isPublished, isPublishedSql } from "@/lib/publish";

export default async function PdfDetailPage(props: PageProps<"/pdfs/[id]">) {
  const { id } = await props.params;
  // Access check and data load run in parallel to save a database round trip.
  const [session, [doc]] = await Promise.all([
    requireActiveSubscriber("/pdfs"),
    db.select().from(pdfDocuments).where(eq(pdfDocuments.id, id)).limit(1),
  ]);
  const isAdmin = isAdminEmail(session.user?.email);
  // 予約配信中の資料は公開日時まで会員には見せない（管理者は確認用に見られる）
  if (!doc || (!isPublished(doc.publishAt) && !isAdmin)) notFound();
  const scheduled = !isPublished(doc.publishAt);

  const part = findBodyPart(doc.bodyPart);
  const relatedVideos = part
    ? await db.select().from(videos).where(and(eq(videos.bodyPart, part.slug), isPublishedSql(videos.publishAt))).orderBy(asc(videos.sortOrder), asc(videos.createdAt)).limit(3)
    : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      {scheduled && doc.publishAt && (
        <p className="mb-6 rounded-[4px] border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
          予約配信：{formatPublishAt(doc.publishAt)} に公開されます。まだ会員には表示されていません（管理者のみ確認できます）。
        </p>
      )}
      <nav aria-label="パンくず" className="text-sm text-muted">
        <Link href="/pdfs" className="hover:underline">
          資料PDF
        </Link>
        {part && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/pdfs?part=${part.slug}`} className="hover:underline">
              {part.label}
            </Link>
          </>
        )}
        {doc.disease && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/pdfs?${new URLSearchParams({ ...(part ? { part: part.slug } : {}), disease: doc.disease })}`}
              className="hover:underline"
            >
              {doc.disease}
            </Link>
          </>
        )}
      </nav>

      <h1 className="mt-4 font-serif text-2xl font-semibold">{doc.title}</h1>
      {doc.description && <p className="mt-2 text-sm leading-relaxed text-muted">{doc.description}</p>}

      <div className="mt-6 overflow-hidden rounded-[4px] border border-line bg-soft">
        <iframe src={doc.url} title={doc.title} className="h-[80vh] w-full" />
      </div>
      <a
        href={doc.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block font-sans text-xs tracking-wider text-accent hover:underline"
      >
        新しいタブで開く / ダウンロード →
      </a>
      <p className="mt-1 text-xs text-muted">スマートフォンで全ページが表示されない場合は、こちらから開いてください。</p>

      {relatedVideos.length > 0 && (
        <section className="mt-14 border-t border-line pt-8">
          <span className="eyebrow">Related video</span>
          <h2 className="mt-1 font-serif text-lg font-semibold">{part?.label}の動画</h2>
          <ul className="mt-4 space-y-2">
            {relatedVideos.map((v) => (
              <li key={v.id}>
                <Link href={`/videos/${v.id}`} className="text-sm hover:text-accent hover:underline">
                  <span className="mr-2 font-sans text-[10px] tracking-widest text-accent">VIDEO</span>
                  {v.title}
                  {v.instructorName && <span className="ml-2 text-xs text-muted">{v.instructorName}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
