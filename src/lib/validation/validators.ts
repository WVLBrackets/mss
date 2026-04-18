import { PasswordRequirements } from "@/lib/constants";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): ValidationResult {
  if (!email?.trim()) return { valid: false, error: "Email is required" };
  if (!EMAIL_RE.test(email.trim().toLowerCase())) {
    return { valid: false, error: "Invalid email format" };
  }
  return { valid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password) return { valid: false, error: "Password is required" };
  if (password.length < PasswordRequirements.MIN_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${PasswordRequirements.MIN_LENGTH} characters`,
    };
  }
  return { valid: true };
}

export function validateRegistration(input: {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
}): ValidationResult {
  const email = validateEmail(input.email);
  if (!email.valid) return email;
  if (!input.name?.trim()) return { valid: false, error: "Name is required" };
  const pw = validatePassword(input.password);
  if (!pw.valid) return pw;
  if (input.password !== input.confirmPassword) {
    return { valid: false, error: "Passwords do not match" };
  }
  return { valid: true };
}
