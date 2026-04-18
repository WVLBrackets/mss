import { randomBytes } from "crypto";

/**
 * Generates a URL-safe random token for email confirmation or password reset.
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}
