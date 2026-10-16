"use client";

import { useEffect, useRef } from "react";

/**
 * Muted, looping background video for the home page hero.
 *
 * Phones only autoplay a video that is muted *and* inline, and iOS checks the
 * `muted` attribute before React has hydrated, so we set muted/playsInline on
 * the element directly and call play() ourselves once it can play.
 * If the phone still refuses (e.g. iPhone Low Power Mode), the poster image
 * simply stays in place.
 */
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
    const tryPlay = () => {
      v.play().catch(() => {
        /* autoplay blocked: keep showing the poster */
      });
    };
    tryPlay();
    v.addEventListener("canplay", tryPlay, { once: true });
    // Some browsers pause background video when the tab is hidden; resume on return.
    const onVisible = () => document.visibilityState === "visible" && v.paused && tryPlay();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      v.removeEventListener("canplay", tryPlay);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <video
      ref={ref}
      className="hero-bg-video pointer-events-none absolute inset-0 h-full w-full object-cover"
      poster="/hero-bg.jpg"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      aria-hidden="true"
    >
      {/* H.264 first: every phone can decode it. WebM is a fallback for browsers without H.264. */}
      <source src="/hero-bg.mp4" type="video/mp4" />
      <source src="/hero-bg.webm" type="video/webm" />
    </video>
  );
}
