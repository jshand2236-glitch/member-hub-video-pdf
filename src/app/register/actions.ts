"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { isFreeAccessMode } from "@/lib/access";

export type RegisterState = {
  error?: string;
};

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@")) {
    return { error: "有効なメールアドレスを入力してください" };
  }
  if (password.length < 8) {
    return { error: "パスワードは8文字以上にしてください" };
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return { error: "このメールアドレスは既に登録されています" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(users).values({
    name: name || null,
    email,
    passwordHash,
  });

  // While pricing isn't finalized (FREE_ACCESS_MODE=true), skip the pricing
  // page and take new members straight to their dashboard/content instead.
  const postRegisterPath = isFreeAccessMode() ? "/dashboard" : "/pricing";

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: postRegisterPath,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "登録には成功しましたが、自動ログインに失敗しました。ログインし直してください。" };
    }
    // next-auth's signIn throws a special redirect error on success; rethrow it
    // so Next.js can actually perform the redirect.
    throw error;
  }

  redirect(postRegisterPath);
}
