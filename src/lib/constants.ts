/** Application-wide constants (portfolio pattern). */

export const Environment = {
  DEVELOPMENT: "development",
  PREVIEW: "preview",
  PRODUCTION: "production",
} as const;

export type EnvironmentValue = (typeof Environment)[keyof typeof Environment];

export const TokenType = {
  CONFIRMATION: "confirmation",
  RESET: "reset",
} as const;

export const TokenExpiration = {
  CONFIRMATION_MS: 24 * 60 * 60 * 1000,
  RESET_MS: 60 * 60 * 1000,
} as const;

export const PasswordRequirements = {
  MIN_LENGTH: 8,
  BCRYPT_ROUNDS: 12,
} as const;

/** Bootstrap admin email (case-insensitive), per BASE_APP_REQUIREMENTS §10. */
export const BOOTSTRAP_ADMIN_EMAIL = "wvanderlaan@gmail.com";

export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  CSRF_INVALID: "CSRF_INVALID",
  SERVER_ERROR: "SERVER_ERROR",
} as const;
