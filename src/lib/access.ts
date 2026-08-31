/**
 * Controls whether members need an active paid subscription to view gated
 * content (videos / PDFs), or whether registering + logging in is enough on
 * its own.
 *
 * Set the FREE_ACCESS_MODE environment variable to "true" to let any
 * logged-in registered member access videos/PDFs without a subscription -
 * useful for launching registration and content before pricing is decided.
 * Leave it unset (or set to anything else) once Stripe billing should be
 * enforced again; no code changes are needed to switch back.
 */
export function isFreeAccessMode(): boolean {
  return process.env.FREE_ACCESS_MODE === "true";
}
