import nodemailer from "nodemailer";

/**
 * Outgoing mail over SMTP. Works with any SMTP provider; the simplest option
 * for this site is a Gmail account with an "app password":
 *
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=465
 *   SMTP_USER=you@gmail.com
 *   SMTP_PASS=<16-character app password>
 *   MAIL_FROM="FUKUOKA MEDICAL CONNECT" <you@gmail.com>   (optional)
 */
export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendMail(options: { to: string; subject: string; text: string; html: string }) {
  const port = Number(process.env.SMTP_PORT ?? 465);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || `"FUKUOKA MEDICAL CONNECT" <${process.env.SMTP_USER}>`,
    ...options,
  });
}
