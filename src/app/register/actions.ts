"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { queueAdminSignupNotice, queueWelcomeEmail } from "@/lib/welcome-email";
import { headers } from "next/headers";
import { LIMITS, clientIp, consume } from "@/lib/rate-limit";
import { isAdminEmail } from "@/lib/admin";
import { EARLY_OFFER } from "@/lib/plans";
import { hasEarlyOfferCookie } from "@/lib/offer";

export type RegisterState = {
  error?: string;
  // エラー時に入力内容を戻すため（パスワードは戻さない）
  values?: { name: string; email: string; student: boolean; school: string };
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
  const student = formData.get("student") ? "requested" : null;
  const school = student ? String(formData.get("school") ?? "").trim().slice(0, 100) : "";

  const values = { name, email, student: !!student, school };
  const fail = (error: string): RegisterState => ({ error, values });

  if (!name) {
    return fail("お名前を入力してください");
  }
  if (name.length > 100) {
    return fail("お名前は100文字以内で入力してください");
  }
  if (!email || !email.includes("@")) {
    return fail("有効なメールアドレスを入力してください");
  }
  if (student && !school) {
    return fail("学校名・学年を入力してください");
  }
  if (password.length < 8) {
    return fail("パスワードは8文字以上にしてください");
  }

  const ip = clientIp(await headers());
  if (!(await consume(`register:ip:${ip}`, LIMITS.registerPerIp))) {
    return fail("短時間に多くの登録が行われました。しばらく時間をおいてからお試しください。");
  }

  // 管理者のメールアドレスは、本人確認なしに登録されると管理画面を乗っ取られるため受け付けない。
  // 管理者を増やすときは、先に会員登録してから ADMIN_EMAILS に追加する。
  if (isAdminEmail(email)) {
    return fail("このメールアドレスでは登録できません。運営にお問い合わせください。");
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return fail("このメールアドレスは既に登録されています。ログインするか、パスワードを再設定してください。");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(users).values({
    name,
    email,
    passwordHash,
    status: "pending",
    student,
    // 当日入会の限定URLから来た人は ¥2,980 で申し込めるようにする
    offer: (await hasEarlyOfferCookie()) ? EARLY_OFFER : null,
  });
  queueAdminSignupNotice({ email, name: name || null, student: !!student, school: school || null });
  queueWelcomeEmail({ email, name: name || null });

  // New sign-ups wait for admin approval first; the dashboard shows that
  // state (and, once approved, the plan sign-up when billing is on).
  const postRegisterPath = "/dashboard";

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: postRegisterPath,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return fail("登録には成功しましたが、自動ログインに失敗しました。ログインし直してください。");
    }
    // next-auth's signIn throws a special redirect error on success; rethrow it
    // so Next.js can actually perform the redirect.
    throw error;
  }

  redirect(postRegisterPath);
}
