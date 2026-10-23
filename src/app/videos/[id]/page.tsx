import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveSubscriber } from "@/lib/require-subscriber";
import { db } from "@/db";
import { events, videos } from "@/db/schema";
import { formatEventDate } from "@/lib/events";
import { eq } from "drizzle-orm";
import { findBodyPart } from "@/data/body-parts";
import { isAdminEmail } from "@/lib/admin";
import { formatPublishAt, isPublished } from "@/lib/publish";

function buildEmbedUrl(video: typeof videos.$inferSelect): string {
  if (video.provider === "youtube") {
    return `https://www.youtube.com/embed/${video.providerVideoId}`;
  }
  // vimeo - unlisted videos require the "h" hash parameter
  const hashParam = video.embedHash ? `?h=${video.embedHash}` : "";
  return `https://player.vimeo.com/video/${video.providerVideoId}${hashParam}`;
}

export default async function VideoDetailPage(props: PageProps<"/videos/[id]">) {
  const { id } = await props.params;
  // Access check and data load run in parallel to save a database round trip.
  const [session, [video]] = await Promise.all([
    requireActiveSubscriber("/videos"),
    db.select().from(videos).where(eq(videos.id, id)).limit(1),
  ]);
  const isAdmin = isAdminEmail(session.user?.email);
  // 予約配信中の動画は公開日時まで会員には見せない（管理者は確認用に見られる）
  if (!video || (!isPublished(video.publishAt) && !isAdmin)) {
    notFound();
  }
  const scheduled = !isPublished(video.publishAt);

  const embedUrl = buildEmbedUrl(video);
  const part = findBodyPart(video.bodyPart);
  const [event] = video.eventId
    ? await db.select().from(events).where(eq(events.id, video.eventId)).limit(1)
    : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      {scheduled && video.publishAt && (
        <p className="mb-6 rounded-[4px] border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
          予約配信：{formatPublishAt(video.publishAt)} に公開されます。まだ会員には表示されていません（管理者のみ確認できます）。
        </p>
      )}
      <nav aria-label="パンくず" className="text-sm text-muted">
        <Link href="/videos" className="hover:underline">
          動画一覧
        </Link>
        {event || !part ? (
          <>
            <span className="mx-2">/</span>
            <Link href="/videos?part=seminar" className="hover:underline">
              オフラインセミナー
            </Link>
          </>
        ) : (
          part && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/videos?part=${part.slug}`} className="hover:underline">
                {part.label}
              </Link>
            </>
          )
        )}
      </nav>

      <p className="mt-4 text-sm font-medium text-accent">
        {[event ? `${formatEventDate(event.eventDate)} ${event.title}` : (part?.label ?? "オフラインセミナー"), video.instructorName]
          .filter(Boolean)
          .join(" ・ ")}
      </p>
      <h1 className="mt-1 font-serif text-2xl font-semibold">{video.title}</h1>
      {video.description && (
        <p className="mt-2 text-sm text-muted">{video.description}</p>
      )}

      <div className="mt-6 aspect-video w-full overflow-hidden rounded-[4px] bg-black">
        <iframe
          src={embedUrl}
          title={video.title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}
