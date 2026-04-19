import nodemailer from "nodemailer";
import { escapeHtml } from "@/lib/emailTemplate";
import { emailSubjectEnvironmentPrefix } from "@/lib/emailSubjectPrefix";
import type { SiteConfig } from "@/lib/siteConfig";
import type { UserPlaceholderValues } from "@/lib/configPlaceholders";
import { resolveUserPlaceholders } from "@/lib/configPlaceholders";

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
    subject: `${emailSubjectEnvironmentPrefix()}Confirm your account`,
    html: `<p>Hi ${safeName},</p><p>Please confirm your account:</p><p><a href="${confirmUrl}">Confirm email</a></p>`,
  });
}

/** Matches `{Tokenized password reset link}` with flexible inner spacing (case-insensitive). */
const TOKENIZED_PW_RESET_LINK = /\{\s*Tokenized\s*password\s*reset\s*link\s*\}/i;

/**
 * Escapes a URL for use inside a double-quoted HTML attribute.
 */
function escapeHtmlAttributeUrl(url: string): string {
  return url.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/**
 * Builds HTML for `pwreset_email_message2`: `link label|{Tokenized password reset link}` → hyperlink.
 */
function buildPwResetMessage2Html(raw: string, resetUrl: string): string {
  const trimmed = raw.trim();
  const pipe = trimmed.indexOf("|");
  if (pipe === -1) {
    const href = escapeHtmlAttributeUrl(resetUrl);
    return `<p style="margin:0;text-align:left">${escapeHtml(trimmed)}</p><p style="margin:0.75rem 0 0;text-align:left"><a href="${href}">${escapeHtml("Reset password")}</a></p>`;
  }
  const linkText = trimmed.slice(0, pipe).trim();
  const afterPipe = trimmed.slice(pipe + 1).trim();
  if (!TOKENIZED_PW_RESET_LINK.test(afterPipe)) {
    return `<p style="margin:0;text-align:left">${escapeHtml(trimmed)}</p>`;
  }
  const href = escapeHtmlAttributeUrl(resetUrl);
  return `<p style="margin:0;text-align:left"><a href="${href}">${escapeHtml(linkText)}</a></p>`;
}

/**
 * Sends password reset email using Config Sheet `pwreset_email_*` fields.
 */
export async function sendPasswordResetEmail(
  to: string,
  cfg: Pick<
    SiteConfig,
    | "pwreset_email_subject"
    | "pwreset_email_header"
    | "pwreset_email_greeting"
    | "pwreset_email_message1"
    | "pwreset_email_message2"
    | "pwreset_email_footer"
  >,
  placeholders: UserPlaceholderValues,
  resetUrl: string,
): Promise<void> {
  const transport = getTransport();
  const greeting = resolveUserPlaceholders(cfg.pwreset_email_greeting, placeholders);
  const html = `
<div style="max-width:560px;margin:0;font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#111;text-align:left">
  <h1 style="font-size:1.25rem;font-weight:600;margin:0;text-align:left">${escapeHtml(cfg.pwreset_email_header)}</h1>
  <br /><br />
  <p style="margin:0;text-align:left">${escapeHtml(greeting)}</p>
  <br />
  <p style="margin:0;text-align:left">${escapeHtml(cfg.pwreset_email_message1)}</p>
  <br />
  ${buildPwResetMessage2Html(cfg.pwreset_email_message2, resetUrl)}
  <br /><br />
  <div style="text-align:left;font-size:80%;">${escapeHtml(cfg.pwreset_email_footer)}</div>
</div>`.trim();
  await transport.sendMail({
    from: fromAddress(),
    to,
    subject: `${emailSubjectEnvironmentPrefix()}${cfg.pwreset_email_subject.trim()}`,
    html,
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
    subject: `${emailSubjectEnvironmentPrefix()}${cfg.dup_email_subject.trim()}`,
    html,
  });
}
