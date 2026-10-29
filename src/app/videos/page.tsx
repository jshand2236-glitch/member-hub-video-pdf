import { isPublishedSql } from "@/lib/publish";
import Image from "next/image";
import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { requireActiveSubscriber } from "@/lib/require-subscriber";
import { db } from "@/db";
import { events, videos } from "@/db/schema";
import { formatEventDate } from "@/lib/events";
import { INSTRUCTORS, findInstructor } from "@/data/instructors";
import { findBodyPart } from "@/data/body-parts";
import { SEMINAR_SLUG, getPartOrder, orderedBodyParts } from "@/lib/part-order";
import FilterChip from "@/components/filter-chip";
import { isAdminEmail } from "@/lib/admin";
import { formatUnlockDate, getMemberStart, lockState, type Lock } from "@/lib/drip";

export const metadata = {
  title: "会員限定動画 | FMC",
};

type Video = typeof videos.$inferSelect;
type Group = {
  slug: string;
  label: string;
  en: string;
  videos: Video[];
  /** Only for the オフラインセミナー group: videos split by meetup, newest first. */
  subgroups?: { key: string; label: string; videos: Video[] }[];
};
const ARCHIVE_SLUG = SEMINAR_SLUG;

function thumbnailFor(video: Video) {
  if (video.thumbnailUrl) return video.thumbnailUrl;
  if (video.provider === "youtube") {
    return `https://img.youtube.com/vi/${video.providerVideoId}/hqdefault.jpg`;
  }
  return null;
}

function VideoCard({ video, showPart, lock }: { video: Video; showPart: boolean; lock: Lock }) {
  const thumb = thumbnailFor(video);
  const part = findBodyPart(video.bodyPart);
  const instructor = video.instructorName ? findInstructor(video.instructorName) : undefined;

  if (lock.locked) {
    // ステップ配信でまだ解放されていない動画：タイトルだけ見せて期待感を出す
    return (
      <div className="flex flex-col overflow-hidden rounded-[4px] border border-line bg-background" aria-disabled="true">
        <div className="relative aspect-video w-full overflow-hidden bg-navy-deep">
          {thumb && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="h-full w-full scale-105 object-cover opacity-30 blur-[3px]" />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="1.5" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            <span className="font-sans text-sm font-semibold">あと{lock.daysLeft}日で公開</span>
            <span className="font-sans text-[11px] text-white/70">{formatUnlockDate(lock.unlocksAt)} 公開予定</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-medium leading-snug text-muted">{video.title}</h3>
          {video.instructorName && <p className="mt-auto pt-4 text-xs text-muted">{video.instructorName}</p>}
        </div>
      </div>
    );
  }

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
  // Access check and data load run in parallel to save a database round trip.
  const [session, allVideos, allEvents, partOrder, searchParams] = await Promise.all([
    requireActiveSubscriber("/videos"),
    db.select().from(videos).where(isPublishedSql(videos.publishAt)).orderBy(asc(videos.sortOrder), asc(videos.createdAt)),
    db.select().from(events).orderBy(desc(events.eventDate)),
    getPartOrder(),
    props.searchParams,
  ]);
  const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const partParam = pick(searchParams?.part);
  // 講師で絞り込み（?instructor=slug）。部位の絞り込みと組み合わせられる
  const instructorOf = (v: Video) => (v.instructorName ? findInstructor(v.instructorName) : undefined);
  const instructors = INSTRUCTORS.map((i) => ({
    ...i,
    count: allVideos.filter((v) => instructorOf(v)?.slug === i.slug).length,
  })).filter((i) => i.count > 0);
  const instructor = instructors.find((i) => i.slug === pick(searchParams?.instructor));
  const pool = instructor ? allVideos.filter((v) => instructorOf(v)?.slug === instructor.slug) : allVideos;
  const qs = (part?: string, inst?: string) => {
    const p = new URLSearchParams();
    if (part) p.set("part", part);
    if (inst) p.set("instructor", inst);
    const q = p.toString();
    return q ? `/videos?${q}` : "/videos";
  };
  const isAdmin = isAdminEmail(session.user?.email);
  const memberStart = allVideos.some((v) => v.unlockWeek && v.unlockWeek > 1) && !isAdmin
    ? await getMemberStart(session.user!.id!)
    : null;
  const lockOf = (v: Video) => lockState(v.unlockWeek, memberStart, { isAdmin });

  // オフラインセミナー: recordings from 医療者交流会 (linked to a meetup) and
  // any video without a body part. Grouped by meetup, newest first.
  const seminarVideos = pool.filter((v) => v.eventId || !findBodyPart(v.bodyPart));
  const eventSubgroups = allEvents
    .map((e) => ({
      key: e.id,
      label: `${formatEventDate(e.eventDate)} ${e.title}`,
      videos: seminarVideos.filter((v) => v.eventId === e.id),
    }))
    .filter((g) => g.videos.length > 0);
  const unlinked = seminarVideos.filter((v) => !eventSubgroups.some((g) => g.videos.includes(v)));
  const archive: Group = {
    slug: ARCHIVE_SLUG,
    label: "オフラインセミナー",
    en: "Offline seminar",
    videos: seminarVideos,
    // Only split into headings when at least one meetup is linked.
    subgroups:
      eventSubgroups.length > 0
        ? [...eventSubgroups, ...(unlinked.length ? [{ key: "other", label: "その他のセミナー", videos: unlinked }] : [])]
        : undefined,
  };

  // Then by body part, in the order chosen in /admin (セミナー included).
  const partGroups: Group[] = orderedBodyParts(partOrder).map((p) => ({
    ...p,
    videos: pool.filter((v) => v.bodyPart === p.slug),
  }));
  const groups: Group[] = partOrder
    .map((slug) => (slug === ARCHIVE_SLUG ? archive : partGroups.find((g) => g.slug === slug)))
    .filter((g): g is Group => !!g && g.videos.length > 0);

  const selected = groups.find((g) => g.slug === partParam);
  const visibleGroups = selected ? [selected] : groups;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <span className="eyebrow">Video</span>
      <h1 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">会員限定動画</h1>
      <p className="mt-3 text-sm text-muted">
        講師や部位を選ぶと、その動画だけを表示します。医療者交流会で収録したセミナー動画は「オフラインセミナー」にあります。
      </p>

      {allVideos.length === 0 ? (
        <p className="mt-10 text-sm text-muted">まだ動画が登録されていません。</p>
      ) : (
        <>
          {instructors.length > 0 && (
            <nav aria-label="講師で絞り込み" className="mt-8">
              <p className="eyebrow">Instructor</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <FilterChip href={qs(selected?.slug)} active={!instructor} label="すべての講師" />
                {instructors.map((i) => (
                  <Link
                    key={i.slug}
                    href={qs(selected?.slug, i.slug)}
                    scroll={false}
                    aria-current={instructor?.slug === i.slug ? "page" : undefined}
                    className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border py-1 pl-1 pr-4 text-sm transition ${
                      instructor?.slug === i.slug
                        ? "border-navy bg-navy text-white"
                        : "border-line bg-background hover:border-accent hover:text-accent"
                    }`}
                  >
                    <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-soft">
                      <Image src={i.avatar} alt="" fill sizes="28px" className="object-cover" />
                    </span>
                    {i.name}
                    <span className={instructor?.slug === i.slug ? "text-white/70" : "text-muted"}>{i.count}</span>
                  </Link>
                ))}
              </div>
            </nav>
          )}

          {instructor && (
            <div className="mt-6 flex items-center gap-4 rounded-[4px] border border-line bg-soft p-4">
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-background">
                <Image src={instructor.avatar} alt="" fill sizes="56px" className="object-cover" />
              </span>
              <div className="min-w-0">
                <p className="font-serif text-lg font-semibold">{instructor.name}</p>
                <p className="text-xs text-muted">
                  {[instructor.title, instructor.specialty && `専門：${instructor.specialty}`].filter(Boolean).join("　")}
                </p>
                <Link href={`/instructors#${instructor.slug}`} className="mt-1 inline-block text-xs text-accent hover:underline">
                  プロフィールを見る →
                </Link>
              </div>
            </div>
          )}

          <nav aria-label="部位で絞り込み" className="mt-8">
            <p className="eyebrow">Body part</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <FilterChip href={qs(undefined, instructor?.slug)} active={!selected} label="すべて" count={pool.length} />
              {groups.map((g) => (
                <FilterChip
                  key={g.slug}
                  href={qs(g.slug, instructor?.slug)}
                  active={selected?.slug === g.slug}
                  label={g.label}
                  count={g.videos.length}
                />
              ))}
            </div>
          </nav>

          {pool.length === 0 && <p className="mt-10 text-sm text-muted">この講師の動画はまだありません。</p>}

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
                      href={qs(g.slug, instructor?.slug)}
                      className="shrink-0 font-sans text-xs tracking-[0.12em] text-accent hover:underline"
                    >
                      {g.slug === ARCHIVE_SLUG ? "セミナーだけ見る" : "この部位だけ見る"} →
                    </Link>
                  )}
                </div>
                {g.subgroups ? (
                  <div className="mt-6 space-y-10">
                    {g.subgroups.map((sg) => (
                      <div key={sg.key}>
                        <h3 className="flex items-center gap-2 text-sm font-semibold">
                          <span className="h-3.5 w-[3px] bg-accent" aria-hidden="true" />
                          {sg.label}
                          <span className="font-sans text-xs font-normal text-muted">{sg.videos.length}本</span>
                        </h3>
                        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {sg.videos.map((video) => (
                            <VideoCard key={video.id} video={video} showPart={false} lock={lockOf(video)} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {g.videos.map((video) => (
                      <VideoCard key={video.id} video={video} showPart={false} lock={lockOf(video)} />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
