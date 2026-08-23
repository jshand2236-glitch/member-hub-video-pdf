import { defineConfig } from "drizzle-kit";

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  if (process.env.NETLIFY_DB_URL) return process.env.NETLIFY_DB_URL;

  throw new Error(
    "No DATABASE_URL (or Netlify NETLIFY_DB_URL) found. Set DATABASE_URL in your environment before running drizzle-kit.",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: resolveDatabaseUrl(),
  },
});
