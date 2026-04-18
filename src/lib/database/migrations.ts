import { sql } from "@/lib/databaseAdapter";
import { getCurrentEnvironment } from "@/lib/appEnvironment";
import { Environment } from "@/lib/constants";
import { BOOTSTRAP_ADMIN_EMAIL, PasswordRequirements } from "@/lib/constants";
import bcrypt from "bcryptjs";

/**
 * Creates core tables if they do not exist. Safe to call repeatedly.
 */
export async function initializeDatabase(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      email_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
      confirmation_token TEXT,
      confirmation_token_expires TIMESTAMPTZ,
      reset_token TEXT,
      reset_token_expires TIMESTAMPTZ,
      is_admin BOOLEAN NOT NULL DEFAULT FALSE,
      avatar_url TEXT,
      environment TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login TIMESTAMPTZ,
      UNIQUE (email, environment)
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_users_email_env ON users (email, environment);
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_users_confirmation_token ON users (confirmation_token)
      WHERE confirmation_token IS NOT NULL;
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users (reset_token)
      WHERE reset_token IS NOT NULL;
  `;
}

/**
 * Ensures a row exists for the bootstrap dev email in local development DBs.
 */
export async function ensureBootstrapDevUser(): Promise<void> {
  const env = getCurrentEnvironment();
  if (env !== Environment.DEVELOPMENT) return;

  const email = BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
  const environment = Environment.DEVELOPMENT;
  const placeholderHash = await bcrypt.hash("dev-bypass-no-login", PasswordRequirements.BCRYPT_ROUNDS);

  await sql`
    INSERT INTO users (email, name, password_hash, email_confirmed, is_admin, environment)
    VALUES (${email}, ${"Local Dev"}, ${placeholderHash}, TRUE, TRUE, ${environment})
    ON CONFLICT (email, environment) DO UPDATE SET
      email_confirmed = TRUE,
      is_admin = TRUE;
  `;
}
