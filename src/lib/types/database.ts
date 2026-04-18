export interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  email_confirmed: boolean;
  confirmation_token: string | null;
  confirmation_token_expires: Date | null;
  reset_token: string | null;
  reset_token_expires: Date | null;
  is_admin: boolean;
  avatar_url: string | null;
  environment: string;
  created_at: Date;
  last_login: Date | null;
}
