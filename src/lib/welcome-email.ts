import { after } from "next/server";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { getAppUrl } from "@/lib/url";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/**
 * Sends the 会員登録完了 email once the response has gone out, so a slow or
 * failing mail server never delays or breaks sign-up. Skipped (with a log
 * line) until SMTP is configured.
 */
export function queueWelcomeEmail(user: { email: string; name?: string | null }) {
  after(async () => {
    if (!isMailConfigured()) {
      console.warn("[welcome-email] SMTP not configured; skipped for", user.email);
      return;
    }
    const base = getAppUrl();
    const greeting = user.name ? `${user.name} 様` : "会員様";
    try {
      await sendMail({
        to: user.email,
        subject: "【AAM Fukuoka】会員登録が完了しました",
        text: [
          greeting,
          "",
          "このたびは AAM Fukuoka にご登録いただき、ありがとうございます。",
          "会員登録が完了しました。ログインすると、会員限定の動画講義と資料PDFをご覧いただけます。",
          "",
          `■ ログイン　　　　${base}/login`,
          `■ 会員限定動画　　${base}/videos`,
          `■ 資料PDF　　　　${base}/pdfs`,
          `■ 講師紹介　　　　${base}/instructors`,
          "",
          `ご登録メールアドレス：${user.email}`,
          `パスワードをお忘れの場合：${base}/forgot-password`,
          "",
          "※ このメールは送信専用です。",
          "※ お心当たりのない場合は、お手数ですがこのメールを破棄してください。",
          "",
          "AAM Fukuoka",
        ].join("\n"),
        html: `
          <div style="font-family:sans-serif;line-height:1.8;color:#1c2436;max-width:560px">
            <p style="font-size:12px;letter-spacing:.2em;color:#bf9b5a;margin:0 0 4px">WELCOME</p>
            <p style="font-size:18px;font-weight:bold;margin:0 0 20px">会員登録が完了しました</p>
            <p>${escapeHtml(greeting)}</p>
            <p>このたびは AAM Fukuoka にご登録いただき、ありがとうございます。<br>
            ログインすると、会員限定の動画講義と資料PDFをご覧いただけます。</p>
            <p style="margin:28px 0">
              <a href="${base}/videos" style="background:#bf9b5a;color:#fff;padding:12px 28px;border-radius:4px;text-decoration:none;display:inline-block">
                動画を見る
              </a>
            </p>
            <table style="font-size:14px;border-collapse:collapse">
              <tr><td style="padding:4px 16px 4px 0;color:#6b7383">会員限定動画</td><td><a href="${base}/videos" style="color:#1c2436">${base}/videos</a></td></tr>
              <tr><td style="padding:4px 16px 4px 0;color:#6b7383">資料PDF</td><td><a href="${base}/pdfs" style="color:#1c2436">${base}/pdfs</a></td></tr>
              <tr><td style="padding:4px 16px 4px 0;color:#6b7383">講師紹介</td><td><a href="${base}/instructors" style="color:#1c2436">${base}/instructors</a></td></tr>
              <tr><td style="padding:4px 16px 4px 0;color:#6b7383">ログイン</td><td><a href="${base}/login" style="color:#1c2436">${base}/login</a></td></tr>
            </table>
            <p style="font-size:12px;color:#6b7383;margin-top:24px">
              ご登録メールアドレス：${escapeHtml(user.email)}<br>
              パスワードをお忘れの場合は <a href="${base}/forgot-password" style="color:#6b7383">こちら</a> から再設定できます。
            </p>
            <p style="font-size:12px;color:#6b7383">
              ※ このメールは送信専用です。<br>
              ※ お心当たりのない場合は、お手数ですがこのメールを破棄してください。
            </p>
            <p>AAM Fukuoka</p>
          </div>`,
      });
    } catch (err) {
      console.error("[welcome-email] failed to send to", user.email, err);
    }
  });
}
