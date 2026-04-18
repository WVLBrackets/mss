import nodemailer from "nodemailer";
import { escapeHtml } from "@/lib/emailTemplate";

function getTransport() {
  const host = process.env.EMAIL_SERVER_HOST;
  const port = Number(process.env.EMAIL_SERVER_PORT || "587");
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;
  const secure = process.env.EMAIL_SERVER_SECURE === "true";
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
  return process.env.EMAIL_FROM ?? "noreply@localhost";
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
