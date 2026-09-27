import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  // Membership approval: "pending" (new sign-up, waiting for the admin),
  // "approved", "rejected" or "suspended". Only "approved" members can view
  // videos/PDFs. Defaults to "approved" so members who registered before
  // approval was introduced keep their access; sign-ups set "pending".
  status: text("status").notNull().default("approved"),
  approvedAt: timestamp("approved_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  stripePriceId: text("stripe_price_id"),
  // one of: incomplete, incomplete_expired, trialing, active, past_due, canceled, unpaid, paused
  status: text("status").notNull(),
  currentPeriodEnd: timestamp("current_period_end", { mode: "date" }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const videos = pgTable("videos", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  // Name of the instructor/presenter featured in this video (optional)
  instructorName: text("instructor_name"),
  // Body part slug from src/data/body-parts.ts (e.g. "lumbar"); null = 未分類
  bodyPart: text("body_part"),
  // "youtube" | "vimeo"
  provider: text("provider").notNull(),
  // YouTube video id (e.g. dQw4w9WgXcQ) or Vimeo video id
  providerVideoId: text("provider_video_id").notNull(),
  // Required for Vimeo unlisted embeds (the "h" parameter); optional for YouTube
  embedHash: text("embed_hash"),
  thumbnailUrl: text("thumbnail_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const pdfDocuments = pgTable("pdf_documents", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  // URL to the PDF file (e.g. /pdfs/foo.pdf served from /public, or an external signed URL)
  url: text("url").notNull(),
  // Body part slug from src/data/body-parts.ts (e.g. "lumbar"); null = 未分類
  bodyPart: text("body_part"),
  // Condition this document is about, e.g. "腰椎椎間板ヘルニア" (free text)
  disease: text("disease"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// One row per rate-limited action (failed login, sign-up, reset request...),
// keyed by a bucket such as "login-fail:email:foo@example.com" or
// "register:ip:1.2.3.4". Old rows are pruned automatically; see
// src/lib/rate-limit.ts.
export const rateLimitEvents = pgTable("rate_limit_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  bucket: text("bucket").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
