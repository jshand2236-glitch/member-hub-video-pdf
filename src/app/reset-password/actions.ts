"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyResetToken } from "@/lib/password-reset";

export type ResetState = {
  error?: string;
};

export async function resetPassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { error: "パスワードは8文字以上にしてください" };
  }
  if (password !== confirm) {
    return { error: "確認用のパスワードが一致しません" };
  }

  const user = await verifyResetToken(token);
  if (!user) {
    return {
      error: "リンクの有効期限が切れているか、すでに使用済みです。もう一度再設定メールを送信してください。",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));

  redirect("/login?reset=1");
}
