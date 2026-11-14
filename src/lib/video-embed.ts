import type { videos } from "@/db/schema";

type Video = typeof videos.$inferSelect;

export function embedUrlFor(video: Video): string {
  if (video.provider === "youtube") return `https://www.youtube.com/embed/${video.providerVideoId}`;
  const hashParam = video.embedHash ? `?h=${video.embedHash}` : "";
  return `https://player.vimeo.com/video/${video.providerVideoId}${hashParam}`;
}

export function thumbnailFor(video: Video): string | null {
  if (video.thumbnailUrl) return video.thumbnailUrl;
  if (video.provider === "youtube") return `https://img.youtube.com/vi/${video.providerVideoId}/hqdefault.jpg`;
  return null;
}
