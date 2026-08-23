import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveSubscriber } from "@/lib/require-subscriber";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { eq } from "drizzle-orm";

function buildEmbedUrl(video: typeof videos.$inferSelect): string {
  if (video.provider === "youtube") {
    return `https://www.youtube.com/embed/${video.providerVideoId}`;
  }
  // vimeo - unlisted videos require the "h" hash parameter
  const hashParam = video.embedHash ? `?h=${video.embedHash}` : "";
  return `https://player.vimeo.com/video/${video.providerVideoId}${hashParam}`;
}

export default async function VideoDetailPage(props: PageProps<"/videos/[id]">) {
  await requireActiveSubscriber("/videos");
  const { id } = await props.params;

  const [video] = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  if (!video) {
    notFound();
  }

  const embedUrl = buildEmbedUrl(video);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <Link href="/videos" className="text-sm text-foreground/60 hover:underline">
        ← 動画一覧へ戻る
      </Link>

      {video.instructorName && (
        <p className="mt-4 text-sm font-medium text-accent">{video.instructorName}</p>
      )}
      <h1 className="mt-1 text-2xl font-bold">{video.title}</h1>
      {video.description && (
        <p className="mt-2 text-sm text-foreground/60">{video.description}</p>
      )}

      <div className="mt-6 aspect-video w-full overflow-hidden rounded-2xl bg-black">
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
