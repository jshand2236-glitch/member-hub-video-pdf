import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  // We don't throw at import time in every environment (e.g. `next build`
  // without env vars configured yet) but calls that actually hit Stripe
  // will fail loudly, which is what we want.
  console.warn(
    "[stripe] STRIPE_SECRET_KEY is not set. Payment features will not work until it is configured.",
  );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  typescript: true,
});
