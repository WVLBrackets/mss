import nodemailer from "nodemailer";
import { escapeHtml } from "@/lib/emailTemplate";
import { emailSubjectEnvironmentPrefix } from "@/lib/emailSubjectPrefix";
import type { SiteConfig } from "@/lib/siteConfig";
import type { UserPlaceholderValues } from "@/lib/configPlaceholders";
import {
  placeholdersFromEmailAddress,
  resolveUserPlaceholders,
} from "@/lib/configPlaceholders";
import {
  buildPipedLinkMessage2Html,
  buildSixPartEmailHtml,
  TOKENIZED_CONFIRMATION_LINK,
  TOKENIZED_PW_RESET_LINK,
} from "@/lib/sixPartTransactionalEmail";

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

type RegEmailCfg = Pick<
  SiteConfig,
  | "reg_email_subject"
  | "reg_email_header"
  | "reg_email_greeting"
  | "reg_email_message1"
  | "reg_email_message2"
  | "reg_email_footer"
>;

/**
 * Sends account confirmation email using Config Sheet `reg_email_*` fields (six-part layout).
 */
export async function sendConfirmationEmail(
  to: string,
  cfg: RegEmailCfg,
  placeholders: UserPlaceholderValues,
  confirmUrl: string,
): Promise<void> {
  const transport = getTransport();
  const greeting = resolveUserPlaceholders(cfg.reg_email_greeting, placeholders);
  const message2Html = buildPipedLinkMessage2Html(
    cfg.reg_email_message2,
    confirmUrl,
    TOKENIZED_CONFIRMATION_LINK,
    "Confirm email",
  );
  const html = buildSixPartEmailHtml({
    header: cfg.reg_email_header,
    greetingResolved: greeting,
    message1: cfg.reg_email_message1,
    message2Html,
    footer: cfg.reg_email_footer,
  });
  await transport.sendMail({
    from: fromAddress(),
    to,
    subject: `${emailSubjectEnvironmentPrefix()}${cfg.reg_email_subject.trim()}`,
    html,
  });
}

type PwResetEmailCfg = Pick<
  SiteConfig,
  | "pwreset_email_subject"
  | "pwreset_email_header"
  | "pwreset_email_greeting"
  | "pwreset_email_message1"
  | "pwreset_email_message2"
  | "pwreset_email_footer"
>;

/**
 * Sends password reset email using Config Sheet `pwreset_email_*` fields.
 */
export async function sendPasswordResetEmail(
  to: string,
  cfg: PwResetEmailCfg,
  placeholders: UserPlaceholderValues,
  resetUrl: string,
): Promise<void> {
  const transport = getTransport();
  const greeting = resolveUserPlaceholders(cfg.pwreset_email_greeting, placeholders);
  const message2Html = buildPipedLinkMessage2Html(
    cfg.pwreset_email_message2,
    resetUrl,
    TOKENIZED_PW_RESET_LINK,
    "Reset password",
  );
  const html = buildSixPartEmailHtml({
    header: cfg.pwreset_email_header,
    greetingResolved: greeting,
    message1: cfg.pwreset_email_message1,
    message2Html,
    footer: cfg.pwreset_email_footer,
  });
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
  const ph = placeholdersFromEmailAddress(to);
  const greeting = resolveUserPlaceholders(cfg.dup_email_greeting, ph);
  const header = resolveUserPlaceholders(cfg.dup_email_header, ph);
  const message1 = resolveUserPlaceholders(cfg.dup_email_message1, ph);
  const message2Resolved = resolveUserPlaceholders(cfg.dup_email_message2, ph);
  const footer = resolveUserPlaceholders(cfg.dup_email_footer, ph);
  const message2Html = `<p style="margin:0;text-align:left">${escapeHtml(message2Resolved)}</p>`;
  const html = buildSixPartEmailHtml({
    header,
    greetingResolved: greeting,
    message1,
    message2Html,
    footer,
  });
  await transport.sendMail({
    from: fromAddress(),
    to,
    subject: `${emailSubjectEnvironmentPrefix()}${cfg.dup_email_subject.trim()}`,
    html,
  });
}
