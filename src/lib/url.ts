/**
 * Resolves the public URL of this deployment.
 *
 * Priority: an explicit APP_URL env var, then the platform's own
 * automatically-provided URL (Netlify's URL/DEPLOY_PRIME_URL, or Vercel's
 * VERCEL_URL), then a localhost fallback for local development.
 */
export function getAppUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  // Netlify: canonical URL for this site/context (production or branch).
  if (process.env.URL) return process.env.URL;
  // Netlify: the specific deploy's own URL (e.g. a deploy preview).
  if (process.env.DEPLOY_PRIME_URL) return process.env.DEPLOY_PRIME_URL;
  // Vercel: hostname only, no protocol.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
