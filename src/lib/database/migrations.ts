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

  await sql`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS handoff_token TEXT;
  `;
  await sql`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS handoff_token_expires TIMESTAMPTZ;
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_users_handoff_token ON users (handoff_token)
      WHERE handoff_token IS NOT NULL;
  `;

  await sql`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS display_name TEXT;
  `;
  await sql`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS initials TEXT;
  `;

  await sql`
    UPDATE users
    SET display_name = NULLIF(trim(split_part(trim(name), ' ', 1)), '')
    WHERE display_name IS NULL OR trim(display_name) = '';
  `;
  await sql`
    UPDATE users
    SET display_name = trim(split_part(trim(email), '@', 1))
    WHERE display_name IS NULL OR trim(display_name) = '';
  `;
  await sql`
    UPDATE users
    SET initials = upper(substr(trim(display_name), 1, 3))
    WHERE initials IS NULL OR trim(initials) = '';
  `;
  await sql`
    UPDATE users SET display_name = 'User' WHERE display_name IS NULL;
  `;
  await sql`
    UPDATE users SET initials = '?' WHERE initials IS NULL;
  `;
  await sql`
    ALTER TABLE users
      ALTER COLUMN display_name SET NOT NULL;
  `;
  await sql`
    ALTER TABLE users
      ALTER COLUMN initials SET NOT NULL;
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
    INSERT INTO users (
      email, name, display_name, initials, password_hash, email_confirmed, is_admin, environment
    )
    VALUES (
      ${email},
      ${"Local Dev"},
      ${"Local"},
      ${"L"},
      ${placeholderHash},
      TRUE,
      TRUE,
      ${environment}
    )
    ON CONFLICT (email, environment) DO UPDATE SET
      email_confirmed = TRUE,
      is_admin = TRUE;
  `;
}
