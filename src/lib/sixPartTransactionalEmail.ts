import { escapeHtml } from "@/lib/emailTemplate";

/** `{Tokenized password reset link}` (flexible spacing, case-insensitive). */
export const TOKENIZED_PW_RESET_LINK =
  /\{\s*Tokenized\s*password\s*reset\s*link\s*\}/i;

/** `{Tokenized confirmation link}` (flexible spacing, case-insensitive). */
export const TOKENIZED_CONFIRMATION_LINK =
  /\{\s*Tokenized\s*confirmation\s*link\s*\}/i;

/**
 * Escapes a URL for use inside a double-quoted HTML attribute.
 */
export function escapeHtmlAttributeUrl(url: string): string {
  return url.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/**
 * Builds HTML for `*_email_message2`: `link label|{…tokenized link placeholder…}` → one hyperlink.
 */
export function buildPipedLinkMessage2Html(
  raw: string,
  actionUrl: string,
  placeholderPattern: RegExp,
  fallbackLinkLabel: string,
): string {
  const trimmed = raw.trim();
  const pipe = trimmed.indexOf("|");
  if (pipe === -1) {
    const href = escapeHtmlAttributeUrl(actionUrl);
    return `<p style="margin:0;text-align:left;text-wrap:pretty">${escapeHtml(trimmed)}</p><p style="margin:0.75rem 0 0;text-align:left;text-wrap:pretty"><a href="${href}">${escapeHtml(fallbackLinkLabel)}</a></p>`;
  }
  const linkText = trimmed.slice(0, pipe).trim();
  const afterPipe = trimmed.slice(pipe + 1).trim();
  if (!placeholderPattern.test(afterPipe)) {
    return `<p style="margin:0;text-align:left;text-wrap:pretty">${escapeHtml(trimmed)}</p>`;
  }
  const href = escapeHtmlAttributeUrl(actionUrl);
  return `<p style="margin:0;text-align:left;text-wrap:pretty"><a href="${href}">${escapeHtml(linkText)}</a></p>`;
}

export type SixPartEmailContent = {
  header: string;
  /** Greeting with sheet placeholders already resolved. */
  greetingResolved: string;
  message1: string;
  message2Html: string;
  footer: string;
};

/**
 * Shared left-aligned transactional layout: header (h1), greeting, message1, message2 block, footer (80%).
 */
export function buildSixPartEmailHtml(parts: SixPartEmailContent): string {
  const { header, greetingResolved, message1, message2Html, footer } = parts;
  return `
<div style="max-width:768px;margin:0;font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#111;text-align:left;text-wrap:pretty">
  <h1 style="font-size:1.25rem;font-weight:600;margin:0;text-align:left;text-wrap:pretty">${escapeHtml(header)}</h1>
  <br /><br />
  <p style="margin:0;text-align:left;text-wrap:pretty">${escapeHtml(greetingResolved)}</p>
  <br />
  <p style="margin:0;text-align:left;text-wrap:pretty">${escapeHtml(message1)}</p>
  <br />
  ${message2Html}
  <br /><br />
  <div style="text-align:left;font-size:80%;text-wrap:pretty">${escapeHtml(footer)}</div>
</div>`.trim();
}
