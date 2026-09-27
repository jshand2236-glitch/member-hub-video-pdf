import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy: only load scripts/styles/fonts from this site (plus
// Google Fonts), only embed video players from YouTube/Vimeo, and never let
// other sites put this site in a frame (clickjacking). 'unsafe-inline' for
// scripts is needed by Next.js's inline bootstrap scripts.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://img.youtube.com https://i.ytimg.com https://i.vimeocdn.com",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  experimental: {
    // Turbopack's build cache (.next/cache/turbopack) records the values of
    // environment variables present during the build - including secrets
    // such as SMTP_PASS - and Netlify's secret scanning then fails the
    // deploy. Builds on Netlify start fresh anyway, so skip writing it.
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
