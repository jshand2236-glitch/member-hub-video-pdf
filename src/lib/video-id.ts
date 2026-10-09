/**
 * Accepts either a bare video ID or a full YouTube/Vimeo URL pasted from the
 * browser, and returns the provider plus the ID (and, for unlisted Vimeo
 * videos, the "h" hash). Returns null when nothing usable is found.
 *
 *   https://youtu.be/YbklWBiOEbM                 -> youtube / YbklWBiOEbM
 *   https://www.youtube.com/watch?v=YbklWBiOEbM  -> youtube / YbklWBiOEbM
 *   https://vimeo.com/123456789/abcdef1234       -> vimeo / 123456789 (h=abcdef1234)
 */
export type ParsedVideo = { provider: "youtube" | "vimeo"; id: string; hash?: string };

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

export function parseVideoInput(raw: string, fallbackProvider: string): ParsedVideo | null {
  const input = raw.trim();
  if (!input) return null;

  let url: URL | null = null;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    url = null;
  }
  const host = url?.hostname.replace(/^www\.|^m\./, "") ?? "";

  if (url && (host === "youtu.be" || host.endsWith("youtube.com") || host === "youtube-nocookie.com")) {
    const fromQuery = url.searchParams.get("v");
    const segments = url.pathname.split("/").filter(Boolean);
    const candidate =
      fromQuery ??
      (host === "youtu.be"
        ? segments[0]
        : ["embed", "shorts", "live", "v"].includes(segments[0] ?? "")
          ? segments[1]
          : undefined);
    return candidate && YOUTUBE_ID.test(candidate) ? { provider: "youtube", id: candidate } : null;
  }

  if (url && (host === "vimeo.com" || host === "player.vimeo.com")) {
    const segments = url.pathname.split("/").filter(Boolean);
    const idIndex = segments.findIndex((s) => /^\d+$/.test(s));
    if (idIndex === -1) return null;
    const hash = url.searchParams.get("h") ?? segments[idIndex + 1];
    return {
      provider: "vimeo",
      id: segments[idIndex],
      ...(hash && /^[A-Za-z0-9]+$/.test(hash) ? { hash } : {}),
    };
  }

  // Not a URL: treat as a bare ID for the chosen provider.
  if (fallbackProvider === "vimeo") {
    return /^\d+$/.test(input) ? { provider: "vimeo", id: input } : null;
  }
  return YOUTUBE_ID.test(input) ? { provider: "youtube", id: input } : null;
}
