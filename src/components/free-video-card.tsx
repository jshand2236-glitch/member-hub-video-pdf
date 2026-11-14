import Link from "next/link";
import type { videos } from "@/db/schema";
import { thumbnailFor } from "@/lib/video-embed";

export default function FreeVideoCard({ video }: { video: typeof videos.$inferSelect }) {
  const thumb = thumbnailFor(video);
  return (
    <Link
      href={`/free/${video.id}`}
      className="group flex flex-col overflow-hidden rounded-[4px] border border-line bg-background transition hover:border-accent"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-navy-deep">
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        )}
        <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 font-sans text-[11px] font-medium text-white">
          無料
        </span>
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white transition group-hover:bg-accent">
            <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-medium leading-snug group-hover:text-accent">{video.title}</h3>
        {video.instructorName && <p className="mt-auto pt-3 text-xs text-muted">{video.instructorName}</p>}
      </div>
    </Link>
  );
}
