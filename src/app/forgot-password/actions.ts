"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createResetToken, RESET_TOKEN_TTL_MS } from "@/lib/password-reset";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { getAppUrl } from "@/lib/url";

export type ForgotState = {
  sent?: boolean;
  error?: string;
};

export async function requestPasswordReset(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const parsed = z.string().email().safeParse(String(formData.get("email") ?? "").trim());
  if (!parsed.success) {
    return { error: "メールアドレスの形式が正しくありません" };
  }
  const email = parsed.data.toLowerCase();

  if (!isMailConfigured()) {
    console.error("[forgot-password] SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS)");
    return {
      error: "現在メールを送信できません。お手数ですが運営までお問い合わせください。",
    };
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // Always answer the same way whether or not the address is registered, so
  // this form can't be used to find out who is a member.
  if (user) {
    const token = createResetToken(user);
    const link = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    const minutes = Math.round(RESET_TOKEN_TTL_MS / 60000);

    try {
      await sendMail({
        to: user.email,
        subject: "【FMC】パスワード再設定のご案内",
        text: [
          `${user.name ? `${user.name} 様` : "会員様"}`,
          "",
          "FUKUOKA MEDICAL CONNECT（FMC）をご利用いただきありがとうございます。",
          "以下のリンクから新しいパスワードを設定してください。",
          "",
          link,
          "",
          `※ このリンクの有効期限は${minutes}分です。`,
          "※ お心当たりのない場合は、このメールを破棄してください。パスワードは変更されません。",
          "",
          "FUKUOKA MEDICAL CONNECT（FMC）",
        ].join("\n"),
        html: `
          <div style="font-family:sans-serif;line-height:1.8;color:#1c2436">
            <p>${user.name ? `${escapeHtml(user.name)} 様` : "会員様"}</p>
            <p>FUKUOKA MEDICAL CONNECT（FMC）をご利用いただきありがとうございます。<br>
            以下のボタンから新しいパスワードを設定してください。</p>
            <p style="margin:28px 0">
              <a href="${link}" style="background:#bf9b5a;color:#fff;padding:12px 28px;border-radius:4px;text-decoration:none;display:inline-block">
                パスワードを再設定する
              </a>
            </p>
            <p style="font-size:12px;color:#6b7383">
              ボタンが押せない場合は、次のURLをブラウザに貼り付けてください。<br>
              <a href="${link}" style="color:#6b7383">${link}</a>
            </p>
            <p style="font-size:12px;color:#6b7383">
              ※ このリンクの有効期限は${minutes}分です。<br>
              ※ お心当たりのない場合は、このメールを破棄してください。パスワードは変更されません。
            </p>
            <p>FUKUOKA MEDICAL CONNECT（FMC）</p>
          </div>`,
      });
    } catch (err) {
      console.error("[forgot-password] failed to send mail", err);
      return { error: "メールの送信に失敗しました。時間をおいて再度お試しください。" };
    }
  }

  return { sent: true };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
