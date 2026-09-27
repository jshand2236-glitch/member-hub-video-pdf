import { after } from "next/server";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { getAppUrl } from "@/lib/url";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

type Mail = { to: string; subject: string; text: string; html: string };

/**
 * Sends mail once the response has gone out, so a slow or failing mail server
 * never delays or breaks the request. Skipped (with a log line) until SMTP is
 * configured.
 */
function queueMail(tag: string, build: () => Mail) {
  after(async () => {
    const mail = build();
    if (!isMailConfigured()) {
      console.warn(`[${tag}] SMTP not configured; skipped for`, mail.to);
      return;
    }
    try {
      await sendMail(mail);
    } catch (err) {
      console.error(`[${tag}] failed to send to`, mail.to, err);
    }
  });
}

const FOOTER_TEXT = [
  "※ このメールは送信専用です。",
  "※ お心当たりのない場合は、お手数ですがこのメールを破棄してください。",
  "",
  "FUKUOKA MEDICAL CONNECT（FMC）",
];

const FOOTER_HTML = `
  <p style="font-size:12px;color:#6b7383">
    ※ このメールは送信専用です。<br>
    ※ お心当たりのない場合は、お手数ですがこのメールを破棄してください。
  </p>
  <p>FUKUOKA MEDICAL CONNECT（FMC）</p>`;

function wrapHtml(eyebrow: string, heading: string, body: string) {
  return `
    <div style="font-family:sans-serif;line-height:1.8;color:#1c2436;max-width:560px">
      <p style="font-size:12px;letter-spacing:.2em;color:#bf9b5a;margin:0 0 4px">${eyebrow}</p>
      <p style="font-size:18px;font-weight:bold;margin:0 0 20px">${heading}</p>
      ${body}
      ${FOOTER_HTML}
    </div>`;
}

function button(href: string, label: string) {
  return `<p style="margin:28px 0">
    <a href="${href}" style="background:#bf9b5a;color:#fff;padding:12px 28px;border-radius:4px;text-decoration:none;display:inline-block">${label}</a>
  </p>`;
}

/** 会員登録の受付メール（運営の承認後に利用可能になる旨を案内）。 */
export function queueWelcomeEmail(user: { email: string; name?: string | null }) {
  queueMail("welcome-email", () => {
    const base = getAppUrl();
    const greeting = user.name ? `${user.name} 様` : "会員様";
    return {
      to: user.email,
      subject: "【FMC】会員登録を受け付けました",
      text: [
        greeting,
        "",
        "このたびは FUKUOKA MEDICAL CONNECT（FMC）にご登録いただき、ありがとうございます。",
        "会員登録を受け付けました。",
        "",
        "FMCは医療従事者限定のコミュニティのため、運営がご登録内容を確認したうえで承認を行っています。",
        "承認後にご利用いただけます。承認が完了しましたら、改めてメールでお知らせします。",
        "",
        `ご登録メールアドレス：${user.email}`,
        `パスワードをお忘れの場合：${base}/forgot-password`,
        "",
        ...FOOTER_TEXT,
      ].join("\n"),
      html: wrapHtml(
        "THANK YOU",
        "会員登録を受け付けました",
        `<p>${escapeHtml(greeting)}</p>
         <p>このたびは FUKUOKA MEDICAL CONNECT（FMC）にご登録いただき、ありがとうございます。</p>
         <p>FMCは医療従事者限定のコミュニティのため、運営がご登録内容を確認したうえで承認を行っています。<br>
         <strong>承認後にご利用いただけます。</strong>承認が完了しましたら、改めてメールでお知らせします。</p>
         <p style="font-size:12px;color:#6b7383;margin-top:24px">
           ご登録メールアドレス：${escapeHtml(user.email)}<br>
           パスワードをお忘れの場合は <a href="${base}/forgot-password" style="color:#6b7383">こちら</a> から再設定できます。
         </p>`,
      ),
    };
  });
}

/** 承認完了のお知らせ。 */
export function queueApprovedEmail(user: { email: string; name?: string | null }) {
  queueMail("approved-email", () => {
    const base = getAppUrl();
    const greeting = user.name ? `${user.name} 様` : "会員様";
    return {
      to: user.email,
      subject: "【FMC】会員登録が承認されました",
      text: [
        greeting,
        "",
        "FUKUOKA MEDICAL CONNECT（FMC）の会員登録が承認されました。",
        "ログインすると、会員限定の動画講義と資料PDFをご覧いただけます。",
        "",
        `■ ログイン　　　　${base}/login`,
        `■ 会員限定動画　　${base}/videos`,
        `■ 資料PDF　　　　${base}/pdfs`,
        `■ 講師紹介　　　　${base}/instructors`,
        "",
        ...FOOTER_TEXT,
      ].join("\n"),
      html: wrapHtml(
        "WELCOME",
        "会員登録が承認されました",
        `<p>${escapeHtml(greeting)}</p>
         <p>FUKUOKA MEDICAL CONNECT（FMC）の会員登録が承認されました。<br>
         ログインすると、会員限定の動画講義と資料PDFをご覧いただけます。</p>
         ${button(`${base}/videos`, "動画を見る")}
         <table style="font-size:14px;border-collapse:collapse">
           <tr><td style="padding:4px 16px 4px 0;color:#6b7383">会員限定動画</td><td><a href="${base}/videos" style="color:#1c2436">${base}/videos</a></td></tr>
           <tr><td style="padding:4px 16px 4px 0;color:#6b7383">資料PDF</td><td><a href="${base}/pdfs" style="color:#1c2436">${base}/pdfs</a></td></tr>
           <tr><td style="padding:4px 16px 4px 0;color:#6b7383">講師紹介</td><td><a href="${base}/instructors" style="color:#1c2436">${base}/instructors</a></td></tr>
           <tr><td style="padding:4px 16px 4px 0;color:#6b7383">ログイン</td><td><a href="${base}/login" style="color:#1c2436">${base}/login</a></td></tr>
         </table>`,
      ),
    };
  });
}

/** 新規登録があったことを管理者（ADMIN_EMAILS）に知らせる。 */
export function queueAdminSignupNotice(user: { email: string; name?: string | null }) {
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (admins.length === 0) return;

  queueMail("admin-signup-notice", () => {
    const base = getAppUrl();
    const who = user.name ? `${user.name}（${user.email}）` : user.email;
    return {
      to: admins.join(","),
      subject: "【FMC管理】新規会員登録の承認依頼",
      text: [
        "新しい会員登録がありました。管理画面から承認してください。",
        "",
        `登録者：${who}`,
        "",
        `管理画面：${base}/admin#members`,
      ].join("\n"),
      html: wrapHtml(
        "ADMIN",
        "新規会員登録の承認依頼",
        `<p>新しい会員登録がありました。管理画面から承認してください。</p>
         <p>登録者：${escapeHtml(who)}</p>
         ${button(`${base}/admin#members`, "管理画面で確認する")}`,
      ),
    };
  });
}
