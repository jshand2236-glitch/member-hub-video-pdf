import Image from "next/image";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { requireActiveSubscriber } from "@/lib/require-subscriber";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { findInstructor } from "@/data/instructors";
import { BODY_PARTS, UNCATEGORIZED, findBodyPart } from "@/data/body-parts";
import FilterChip from "@/components/filter-chip";

export const metadata = {
  title: "会員限定動画 | AAM Fukuoka",
};

type Video = typeof videos.$inferSelect;
type Group = { slug: string; label: string; en: string; videos: Video[] };

function thumbnailFor(video: Video) {
  if (video.thumbnailUrl) return video.thumbnailUrl;
  if (video.provider === "youtube") {
    return `https://img.youtube.com/vi/${video.providerVideoId}/hqdefault.jpg`;
  }
  return null;
}

function VideoCard({ video, showPart }: { video: Video; showPart: boolean }) {
  const thumb = thumbnailFor(video);
  const part = findBodyPart(video.bodyPart);
  const instructor = video.instructorName ? findInstructor(video.instructorName) : undefined;

  return (
    <Link
      href={`/videos/${video.id}`}
      className="group flex flex-col overflow-hidden rounded-[4px] border border-line bg-background transition hover:border-accent"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-soft">
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        )}
        {showPart && part && (
          <span className="absolute left-2 top-2 rounded-[3px] bg-navy/85 px-2 py-0.5 text-[11px] tracking-wider text-white">
            {part.label}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-medium leading-snug">{video.title}</h3>
        {video.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">{video.description}</p>
        )}
        {video.instructorName && (
          <div className="mt-auto flex items-center gap-2 pt-4">
            {instructor ? (
              <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-soft">
                <Image src={instructor.avatar} alt="" fill sizes="28px" className="object-cover" />
              </span>
            ) : null}
            <span className="text-xs text-muted">{video.instructorName}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default async function VideosPage(props: PageProps<"/videos">) {
  await requireActiveSubscriber("/videos");
  const searchParams = await props.searchParams;
  const partParam = Array.isArray(searchParams?.part) ? searchParams.part[0] : searchParams?.part;

  const allVideos = await db.select().from(videos).orderBy(asc(videos.sortOrder));

  // Group by body part, in head-to-foot order; videos without a part go last.
  const groups: Group[] = [
    ...BODY_PARTS.map((p) => ({ ...p, videos: allVideos.filter((v) => v.bodyPart === p.slug) })),
    { ...UNCATEGORIZED, videos: allVideos.filter((v) => !findBodyPart(v.bodyPart)) },
  ].filter((g) => g.videos.length > 0);

  const selected = groups.find((g) => g.slug === partParam);
  const visibleGroups = selected ? [selected] : groups;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <span className="eyebrow">Video</span>
      <h1 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">会員限定動画</h1>
      <p className="mt-3 text-sm text-muted">部位を選ぶと、その部位の動画だけを表示します。</p>

      {allVideos.length === 0 ? (
        <p className="mt-10 text-sm text-muted">まだ動画が登録されていません。</p>
      ) : (
        <>
          <nav aria-label="部位で絞り込み" className="mt-8 flex flex-wrap gap-2">
            <FilterChip href="/videos" active={!selected} label="すべて" count={allVideos.length} />
            {groups.map((g) => (
              <FilterChip
                key={g.slug}
                href={`/videos?part=${g.slug}`}
                active={selected?.slug === g.slug}
                label={g.label}
                count={g.videos.length}
              />
            ))}
          </nav>

          <div className="mt-12 space-y-16">
            {visibleGroups.map((g) => (
              <section key={g.slug} id={g.slug} aria-labelledby={`h-${g.slug}`}>
                <div className="flex items-end justify-between gap-4 border-b border-line pb-3">
                  <div>
                    <span className="eyebrow">{g.en}</span>
                    <h2 id={`h-${g.slug}`} className="mt-1 font-serif text-xl font-semibold">
                      {g.label}
                      <span className="ml-2 font-sans text-sm font-normal text-muted">
                        {g.videos.length}本
                      </span>
                    </h2>
                  </div>
                  {!selected && groups.length > 1 && (
                    <Link
                      href={`/videos?part=${g.slug}`}
                      className="shrink-0 font-sans text-xs tracking-[0.12em] text-accent hover:underline"
                    >
                      この部位だけ見る →
                    </Link>
                  )}
                </div>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {g.videos.map((video) => (
                    <VideoCard key={video.id} video={video} showPart={false} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
