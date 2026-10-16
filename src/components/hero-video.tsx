"use client";

import { useEffect, useRef } from "react";

/**
 * Muted, looping background video for the home page hero.
 *
 * - Phones in portrait get a vertical 720x1280 cut (hero-bg-mobile.mp4);
 *   wider screens get the 16:9 one. The source is chosen in the browser so
 *   each device downloads only one file.
 * - iOS only autoplays a video that is muted *and* inline, and checks the
 *   attributes before React hydrates, so they are set on the element directly
 *   and play() is called explicitly.
 * - If autoplay is still refused (e.g. iPhone Low Power Mode), playback starts
 *   on the visitor's first touch or scroll; until then the poster image shows.
 */
type Src = { mp4: string; webm?: string; poster: string };
const SOURCES: Record<"mobile" | "desktop", Src> = {
  mobile: { mp4: "/hero-bg-mobile.mp4", poster: "/hero-bg-mobile.jpg" },
  desktop: { mp4: "/hero-bg.mp4", webm: "/hero-bg.webm", poster: "/hero-bg.jpg" },
};

export default function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");

    const portrait = window.matchMedia("(max-width: 767px) and (orientation: portrait)").matches;
    const src = portrait ? SOURCES.mobile : SOURCES.desktop;
    v.poster = src.poster;
    v.replaceChildren();
    const add = (url: string, type: string) => {
      const s = document.createElement("source");
      s.src = url;
      s.type = type;
      v.appendChild(s);
    };
    add(src.mp4, "video/mp4");
    if (src.webm) add(src.webm, "video/webm");
    v.load();

    const tryPlay = () => {
      const p = v.play();
      if (p) p.catch(() => {});
    };
    const onInteract = () => {
      if (v.paused) tryPlay();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible" && v.paused) tryPlay();
    };

    v.addEventListener("loadeddata", tryPlay);
    v.addEventListener("canplay", tryPlay);
    window.addEventListener("touchstart", onInteract, { passive: true });
    window.addEventListener("scroll", onInteract, { passive: true });
    document.addEventListener("visibilitychange", onVisible);
    tryPlay();

    return () => {
      v.removeEventListener("loadeddata", tryPlay);
      v.removeEventListener("canplay", tryPlay);
      window.removeEventListener("touchstart", onInteract);
      window.removeEventListener("scroll", onInteract);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <video
      ref={ref}
      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      poster="/hero-bg.jpg"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      aria-hidden="true"
    />
  );
}
