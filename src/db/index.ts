import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { getConnectionString } from "@netlify/database";
import * as schema from "./schema";

function resolveConnectionString(): string {
  // An explicit DATABASE_URL always wins (e.g. Neon on Vercel, or any other
  // Postgres provider/host).
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  // Otherwise, if this app is running on Netlify with the Netlify DB
  // extension enabled, a Postgres database is auto-provisioned per
  // deploy/branch and this returns its connection string with no manual
  // setup required.
  try {
    const url = getConnectionString();
    if (url) return url;
  } catch {
    // Not running in a Netlify DB context (e.g. plain `next build` with no
    // DB configured yet, or another host entirely) - fall through.
  }

  console.warn(
    "[db] No DATABASE_URL and no Netlify Database detected. Database features will not work until one is configured.",
  );
  return "postgres://placeholder";
}

// A small connection pool is enough for a membership site of this size and
// plays nicely with serverless platforms when pointed at a pooled
// connection string (e.g. Neon's "-pooler" host). See README.md for
// provider-specific setup.
const client = postgres(resolveConnectionString(), {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
