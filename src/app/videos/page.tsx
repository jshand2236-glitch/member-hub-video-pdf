import Link from "next/link";
import { requireActiveSubscriber } from "@/lib/require-subscriber";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { asc } from "drizzle-orm";
import { findInstructor } from "@/data/instructors";

export const metadata = {
  title: "会員限定動画 | Member Hub",
};

type Video = typeof videos.$inferSelect;

function thumbnailFor(video: Video) {
  if (video.thumbnailUrl) return video.thumbnailUrl;
  if (video.provider === "youtube") {
    return `https://img.youtube.com/vi/${video.providerVideoId}/hqdefault.jpg`;
  }
  return null;
}

function InstructorBlurb({ name }: { name: string }) {
  const profile = findInstructor(name);
  if (!profile) return null;
  return (
    <div className="mt-2 max-w-2xl">
      <p className="text-sm text-foreground/60">
        {profile.title}
        {profile.qualifications.length > 0 && (
          <span> ／ {profile.qualifications.join("・")}</span>
        )}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-foreground/70">{profile.bio}</p>
      <Link
        href={`/instructors#${profile.slug}`}
        className="mt-2 inline-block text-sm font-medium text-accent hover:underline"
      >
        プロフィールを見る →
      </Link>
    </div>
  );
}

function VideoCard({ video }: { video: Video }) {
  const thumb = thumbnailFor(video);
  return (
    <Link
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
        <h3 className="font-medium">{video.title}</h3>
        {video.description && (
          <p className="mt-1 line-clamp-2 text-sm text-foreground/60">
            {video.description}
          </p>
        )}
      </div>
    </Link>
  );
}

export default async function VideosPage() {
  await requireActiveSubscriber("/videos");

  const allVideos = await db.select().from(videos).orderBy(asc(videos.sortOrder));

  // Group videos by instructor (in the order each instructor's first video
  // appears, which follows the admin-controlled sortOrder) so that, once
  // several instructors' videos are mixed together, members can jump
  // straight to the one they're looking for instead of scrolling a single
  // long grid.
  const groups = new Map<string, Video[]>();
  for (const video of allVideos) {
    const key = video.instructorName?.trim() || "講師未設定";
    const existing = groups.get(key);
    if (existing) {
      existing.push(video);
    } else {
      groups.set(key, [video]);
    }
  }
  const groupEntries = Array.from(groups.entries()).map(([name, list], index) => ({
    id: `instructor-${index}`,
    name,
    videos: list,
  }));
  const showGrouped = groupEntries.length > 1;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold">会員限定動画</h1>

      {allVideos.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/60">
          まだ動画が登録されていません。
        </p>
      ) : !showGrouped ? (
        <>
          {groupEntries[0].name !== "講師未設定" && (
            <>
              <p className="mt-2 text-sm font-medium text-accent">
                講師: {groupEntries[0].name}
              </p>
              <InstructorBlurb name={groupEntries[0].name} />
            </>
          )}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {allVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </>
      ) : (
        <>
          <nav className="mt-8 flex flex-wrap gap-2" aria-label="講師で絞り込み">
            {groupEntries.map((group) => (
              <a
                key={group.id}
                href={`#${group.id}`}
                className="rounded-full border border-foreground/15 px-4 py-1.5 text-sm hover:bg-foreground/5"
              >
                {group.name}
                <span className="ml-1.5 text-foreground/40">{group.videos.length}</span>
              </a>
            ))}
          </nav>

          <div className="mt-4 space-y-14">
            {groupEntries.map((group) => (
              <section key={group.id} id={group.id} className="scroll-mt-20">
                <h2 className="text-xs font-medium tracking-widest text-accent">
                  INSTRUCTOR
                </h2>
                <p className="mt-1 font-serif text-xl font-semibold">{group.name}</p>
                <InstructorBlurb name={group.name} />
                <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {group.videos.map((video) => (
                    <VideoCard key={video.id} video={video} />
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
