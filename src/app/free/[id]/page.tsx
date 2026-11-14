import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import FreeVideoCard from "@/components/free-video-card";
import { getFreeVideo, getFreeVideos } from "@/lib/free-videos";
import { embedUrlFor } from "@/lib/video-embed";
import { findInstructor } from "@/data/instructors";
import JoinBox from "@/components/join-box";

export async function generateMetadata(props: PageProps<"/free/[id]">) {
  const { id } = await props.params;
  const video = await getFreeVideo(id);
  return { title: video ? `${video.title} | FMC 無料動画` : "無料動画 | FMC" };
}

export default async function FreeVideoPage(props: PageProps<"/free/[id]">) {
  await connection();
  const { id } = await props.params;
  const [video, all, session] = await Promise.all([getFreeVideo(id), getFreeVideos(), auth()]);
  if (!video) notFound();

  const others = all.filter((v) => v.id !== video.id).slice(0, 3);
  const instructor = video.instructorName ? findInstructor(video.instructorName) : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <nav aria-label="パンくず" className="text-sm text-muted">
        <Link href="/free" className="hover:underline">
          無料で見られる動画
        </Link>
      </nav>
      <h1 className="mt-3 font-serif text-2xl font-semibold">{video.title}</h1>
      {video.instructorName && (
        <p className="mt-2 text-sm text-muted">
          講師：
          {instructor ? (
            <Link href={`/instructors#${instructor.slug}`} className="hover:text-accent hover:underline">
              {video.instructorName}
            </Link>
          ) : (
            video.instructorName
          )}
        </p>
      )}

      <div className="mt-6 aspect-video w-full overflow-hidden rounded-[4px] bg-black">
        <iframe
          src={embedUrlFor(video)}
          title={video.title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      {video.description && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted">{video.description}</p>}

      {!session?.user && <JoinBox />}

      {others.length > 0 && (
        <section className="mt-14">
          <h2 className="font-semibold">ほかの無料動画</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            {others.map((v) => (
              <FreeVideoCard key={v.id} video={v} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
