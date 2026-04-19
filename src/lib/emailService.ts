import nodemailer from "nodemailer";
import { escapeHtml } from "@/lib/emailTemplate";
import type { SiteConfig } from "@/lib/siteConfig";

/**
 * Reads mail-related env at **runtime**. Dot access (`process.env.FOO`) can be
 * compile-replaced; Vercel **Sensitive** values are absent during `next build`, which
 * can leave Preview bundles with empty host while Production builds look fine.
 */
function getTransport() {
  const env = process.env;
  const host = env["EMAIL_SERVER_HOST"];
  const port = Number(env["EMAIL_SERVER_PORT"] || "587");
  const user = env["EMAIL_SERVER_USER"];
  const pass = env["EMAIL_SERVER_PASSWORD"];
  const secure = env["EMAIL_SERVER_SECURE"] === "true";
  if (!host) {
    throw new Error("EMAIL_SERVER_HOST is required to send email");
  }
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });
}

function fromAddress(): string {
  const v = process.env["EMAIL_FROM"];
  return v && v !== "" ? v : "noreply@localhost";
}

/**
 * Sends account confirmation email with token link.
 */
export async function sendConfirmationEmail(
  to: string,
  name: string,
  confirmUrl: string,
): Promise<void> {
  const transport = getTransport();
  const safeName = escapeHtml(name);
  await transport.sendMail({
    from: fromAddress(),
    to,
    subject: "Confirm your account",
    html: `<p>Hi ${safeName},</p><p>Please confirm your account:</p><p><a href="${confirmUrl}">Confirm email</a></p>`,
  });
}

/**
 * Sends password reset email with token link.
 */
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string,
): Promise<void> {
  const transport = getTransport();
  const safeName = escapeHtml(name);
  await transport.sendMail({
    from: fromAddress(),
    to,
    subject: "Reset your password",
    html: `<p>Hi ${safeName},</p><p>Reset your password:</p><p><a href="${resetUrl}">Reset password</a></p>`,
  });
}

/**
 * Notifies someone who tried to register with an email that already exists (same UX as new signup).
 * Body is built from Config Sheet `dup_email_*` fields.
 */
export async function sendDuplicateRegistrationEmail(
  to: string,
  cfg: Pick<
    SiteConfig,
    | "dup_email_subject"
    | "dup_email_header"
    | "dup_email_greeting"
    | "dup_email_message1"
    | "dup_email_message2"
    | "dup_email_footer"
  >,
): Promise<void> {
  const transport = getTransport();
  const html = `
<div style="max-width:560px;margin:0 auto;font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#111">
  <h1 style="font-size:1.25rem;font-weight:600;margin:0 0 1rem">${escapeHtml(cfg.dup_email_header)}</h1>
  <p style="margin:0 0 0.5rem">${escapeHtml(cfg.dup_email_greeting)}</p>
  <br />
  <p style="margin:0 0 0.5rem">${escapeHtml(cfg.dup_email_message1)}</p>
  <p style="margin:0 0 0.5rem">${escapeHtml(cfg.dup_email_message2)}</p>
  <br />
  <div style="text-align:center;margin-top:1rem;font-size:14px;color:#444">${escapeHtml(cfg.dup_email_footer)}</div>
</div>`.trim();
  await transport.sendMail({
    from: fromAddress(),
    to,
    subject: cfg.dup_email_subject.trim(),
    html,
  });
}
