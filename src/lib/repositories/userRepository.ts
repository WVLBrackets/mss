import { sql } from "@/lib/databaseAdapter";
import type { UserRow } from "@/lib/types/database";

function mapUser(row: Record<string, unknown>): UserRow {
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    password_hash: String(row.password_hash),
    email_confirmed: Boolean(row.email_confirmed),
    confirmation_token: row.confirmation_token as string | null,
    confirmation_token_expires: row.confirmation_token_expires as Date | null,
    reset_token: row.reset_token as string | null,
    reset_token_expires: row.reset_token_expires as Date | null,
    is_admin: Boolean(row.is_admin),
    avatar_url: row.avatar_url as string | null,
    environment: String(row.environment),
    created_at: row.created_at as Date,
    last_login: row.last_login as Date | null,
  };
}

export async function getUserByEmail(
  email: string,
  environment: string,
): Promise<UserRow | null> {
  const rows = await sql`
    SELECT * FROM users WHERE lower(email) = lower(${email}) AND environment = ${environment}
    LIMIT 1
  `;
  const r = (rows as Record<string, unknown>[])[0];
  return r ? mapUser(r) : null;
}

export async function getUserById(
  id: string,
  environment: string,
): Promise<UserRow | null> {
  const rows = await sql`
    SELECT * FROM users WHERE id = ${id} AND environment = ${environment}
    LIMIT 1
  `;
  const r = (rows as Record<string, unknown>[])[0];
  return r ? mapUser(r) : null;
}

export async function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  environment: string;
  confirmationToken: string | null;
  confirmationExpires: Date | null;
}): Promise<UserRow> {
  const rows = await sql`
    INSERT INTO users (
      email, name, password_hash, environment,
      confirmation_token, confirmation_token_expires
    ) VALUES (
      lower(${input.email}),
      ${input.name},
      ${input.passwordHash},
      ${input.environment},
      ${input.confirmationToken},
      ${input.confirmationExpires}
    )
    RETURNING *
  `;
  return mapUser((rows as Record<string, unknown>[])[0]);
}

export async function updateUserConfirmation(
  userId: string,
  environment: string,
): Promise<void> {
  await sql`
    UPDATE users SET
      email_confirmed = TRUE,
      confirmation_token = NULL,
      confirmation_token_expires = NULL
    WHERE id = ${userId} AND environment = ${environment}
  `;
}

export async function setConfirmationToken(
  userId: string,
  environment: string,
  token: string,
  expires: Date,
): Promise<void> {
  await sql`
    UPDATE users SET
      confirmation_token = ${token},
      confirmation_token_expires = ${expires}
    WHERE id = ${userId} AND environment = ${environment}
  `;
}

export async function setResetToken(
  email: string,
  environment: string,
  token: string,
  expires: Date,
): Promise<void> {
  await sql`
    UPDATE users SET
      reset_token = ${token},
      reset_token_expires = ${expires}
    WHERE lower(email) = lower(${email}) AND environment = ${environment}
  `;
}

export async function getUserByResetToken(
  token: string,
  environment: string,
): Promise<UserRow | null> {
  const rows = await sql`
    SELECT * FROM users
    WHERE reset_token = ${token} AND environment = ${environment}
    LIMIT 1
  `;
  const r = (rows as Record<string, unknown>[])[0];
  return r ? mapUser(r) : null;
}

export async function clearResetToken(userId: string, environment: string): Promise<void> {
  await sql`
    UPDATE users SET reset_token = NULL, reset_token_expires = NULL
    WHERE id = ${userId} AND environment = ${environment}
  `;
}

export async function updatePassword(
  userId: string,
  environment: string,
  passwordHash: string,
): Promise<void> {
  await sql`
    UPDATE users SET password_hash = ${passwordHash}
    WHERE id = ${userId} AND environment = ${environment}
  `;
}

export async function updateProfile(input: {
  userId: string;
  environment: string;
  name?: string;
  avatarUrl?: string | null;
}): Promise<void> {
  if (input.name !== undefined) {
    await sql`
      UPDATE users SET name = ${input.name}
      WHERE id = ${input.userId} AND environment = ${input.environment}
    `;
  }
  if (input.avatarUrl !== undefined) {
    await sql`
      UPDATE users SET avatar_url = ${input.avatarUrl}
      WHERE id = ${input.userId} AND environment = ${input.environment}
    `;
  }
}

export async function updateLastLogin(userId: string, environment: string): Promise<void> {
  await sql`
    UPDATE users SET last_login = NOW()
    WHERE id = ${userId} AND environment = ${environment}
  `;
}

export async function listUsers(environment: string): Promise<UserRow[]> {
  const rows = await sql`
    SELECT * FROM users WHERE environment = ${environment}
    ORDER BY created_at DESC
  `;
  return (rows as Record<string, unknown>[]).map(mapUser);
}

export async function updateUserAdminFields(input: {
  userId: string;
  environment: string;
  name?: string;
  email?: string;
  isAdmin?: boolean;
}): Promise<void> {
  if (input.name !== undefined) {
    await sql`UPDATE users SET name = ${input.name}
      WHERE id = ${input.userId} AND environment = ${input.environment}`;
  }
  if (input.email !== undefined) {
    await sql`UPDATE users SET email = lower(${input.email})
      WHERE id = ${input.userId} AND environment = ${input.environment}`;
  }
  if (input.isAdmin !== undefined) {
    await sql`UPDATE users SET is_admin = ${input.isAdmin}
      WHERE id = ${input.userId} AND environment = ${input.environment}`;
  }
}

export async function deleteUser(userId: string, environment: string): Promise<void> {
  await sql`DELETE FROM users WHERE id = ${userId} AND environment = ${environment}`;
}

export async function getUserByConfirmationToken(
  token: string,
  environment: string,
): Promise<UserRow | null> {
  const rows = await sql`
    SELECT * FROM users
    WHERE confirmation_token = ${token} AND environment = ${environment}
    LIMIT 1
  `;
  const r = (rows as Record<string, unknown>[])[0];
  return r ? mapUser(r) : null;
}
