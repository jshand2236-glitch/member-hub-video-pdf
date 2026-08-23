import Link from "next/link";
import { requireActiveSubscriber } from "@/lib/require-subscriber";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { asc } from "drizzle-orm";

export const metadata = {
  title: "会員限定動画 | Member Hub",
};

function thumbnailFor(video: typeof videos.$inferSelect) {
  if (video.thumbnailUrl) return video.thumbnailUrl;
  if (video.provider === "youtube") {
    return `https://img.youtube.com/vi/${video.providerVideoId}/hqdefault.jpg`;
  }
  return null;
}

export default async function VideosPage() {
  await requireActiveSubscriber("/videos");

  const allVideos = await db.select().from(videos).orderBy(asc(videos.sortOrder));

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold">会員限定動画</h1>

      {allVideos.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/60">
          まだ動画が登録されていません。
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {allVideos.map((video) => {
            const thumb = thumbnailFor(video);
            return (
              <Link
                key={video.id}
                href={`/videos/${video.id}`}
                className="group overflow-hidden rounded-2xl border border-foreground/10"
              >
                <div className="aspect-video w-full bg-foreground/5">
                  {thumb && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt={video.title}
                      className="h-full w-full object-cover transition group-hover:opacity-80"
                    />
                  )}
                </div>
                <div className="p-4">
                  {video.instructorName && (
                    <p className="text-xs font-medium text-accent">
                      {video.instructorName}
                    </p>
                  )}
                  <h2 className="mt-0.5 font-medium">{video.title}</h2>
                  {video.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-foreground/60">
                      {video.description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
