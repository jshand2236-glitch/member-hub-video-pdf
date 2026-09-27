import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { queueAdminSignupNotice, queueWelcomeEmail } from "@/lib/welcome-email";
import { LIMITS, clientIp, consume } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email(),
  password: z.string().min(8, "パスワードは8文字以上にしてください"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容が正しくありません" },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();

  if (!(await consume(`register:ip:${clientIp(req.headers)}`, LIMITS.registerPerIp))) {
    return NextResponse.json(
      { error: "短時間に多くの登録が行われました。しばらく時間をおいてからお試しください。" },
      { status: 429 },
    );
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "このメールアドレスは既に登録されています" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const [created] = await db
    .insert(users)
    .values({
      name: parsed.data.name,
      email,
      passwordHash,
      status: "pending",
    })
    .returning({ id: users.id, email: users.email });
  queueAdminSignupNotice({ email, name: parsed.data.name ?? null });
  queueWelcomeEmail({ email: created.email, name: parsed.data.name ?? null });

  return NextResponse.json({ id: created.id, email: created.email }, { status: 201 });
}
