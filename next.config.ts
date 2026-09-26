import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Turbopack's build cache (.next/cache/turbopack) records the values of
    // environment variables present during the build - including secrets
    // such as SMTP_PASS - and Netlify's secret scanning then fails the
    // deploy. Builds on Netlify start fresh anyway, so skip writing it.
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
