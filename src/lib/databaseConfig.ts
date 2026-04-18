import { getCurrentEnvironment } from "@/lib/appEnvironment";
import { Environment } from "@/lib/constants";

/**
 * Returns the Neon/Postgres connection URL for the active deployment context.
 * Uses the same variable names as PROJECT_START_CHECKLIST Part 3.
 */
export function getPostgresUrl(): string {
  const env = getCurrentEnvironment();

  if (env === Environment.DEVELOPMENT) {
    const url =
      process.env.LOCAL_POSTGRES_URL ||
      process.env.POSTGRES_URL_LOCAL ||
      process.env.POSTGRES_URL ||
      process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "Database misconfiguration: LOCAL_POSTGRES_URL (or POSTGRES_URL_LOCAL / POSTGRES_URL / DATABASE_URL) is required for local development.",
      );
    }
    return url;
  }

  if (env === Environment.PRODUCTION) {
    const url =
      process.env.PRODUCTION_POSTGRES_URL ||
      process.env.POSTGRES_URL ||
      process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "Database misconfiguration: PRODUCTION_POSTGRES_URL (or POSTGRES_URL / DATABASE_URL) is required in production.",
      );
    }
    return url;
  }

  const url =
    process.env.PREVIEW_POSTGRES_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Database misconfiguration: PREVIEW_POSTGRES_URL (or POSTGRES_URL / DATABASE_URL) is required for preview/staging.",
    );
  }
  return url;
}
