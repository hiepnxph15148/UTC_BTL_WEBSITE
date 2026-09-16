/** Client-side form helpers for storefront. */

import type { MessageKey } from "@/i18n/messages";

export const PASSWORD_MIN_LENGTH = 6;
export const NAME_MIN_LENGTH = 2;
export const MESSAGE_MIN_LENGTH = 5;
export const MESSAGE_MAX_LENGTH = 4000;
export const PHONE_MAX_LENGTH = 30;
export const ADDRESS_MIN_LENGTH = 5;
export const REASON_MIN_LENGTH = 3;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** VN mobile: 0xxxxxxxxx or +84xxxxxxxxx. */
const VN_PHONE_RE = /^(?:\+84|84|0)(?:3|5|7|8|9)\d{8}$/;

export type ValidationIssue = {
  key: MessageKey;
  vars?: Record<string, string | number>;
};

export function normalizePhone(value: string): string {
  return value.replace(/[\s.\-()]/g, "").trim();
}

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  return email.length > 0 && email.length <= 256 && EMAIL_RE.test(email);
}

export function isValidVnPhone(value: string): boolean {
  const phone = normalizePhone(value);
  if (!phone || phone.length > PHONE_MAX_LENGTH) return false;
  return VN_PHONE_RE.test(phone);
}

export function isValidPassword(value: string): boolean {
  return value.length >= PASSWORD_MIN_LENGTH && value.length <= 128;
}

export function isNonEmpty(value: string, min = 1): boolean {
  return value.trim().length >= min;
}

export function passwordError(value: string): ValidationIssue | null {
  if (!value) return { key: "validation.passwordRequired" };
  if (value.length < PASSWORD_MIN_LENGTH) {
    return { key: "validation.passwordMin", vars: { min: PASSWORD_MIN_LENGTH } };
  }
  if (value.length > 128) return { key: "validation.passwordMax" };
  return null;
}

export function emailError(value: string): ValidationIssue | null {
  if (!value.trim()) return { key: "validation.emailRequired" };
  if (!isValidEmail(value)) return { key: "validation.emailInvalid" };
  return null;
}

export function phoneError(value: string): ValidationIssue | null {
  if (!value.trim()) return { key: "validation.phoneRequired" };
  if (!isValidVnPhone(value)) return { key: "validation.phoneInvalid" };
  return null;
}

export function nameError(
  value: string,
  min = NAME_MIN_LENGTH,
): ValidationIssue | null {
  if (!isNonEmpty(value, min)) {
    return { key: "validation.nameMin", vars: { min } };
  }
  return null;
}

export function recipientError(
  value: string,
  min = NAME_MIN_LENGTH,
): ValidationIssue | null {
  if (!isNonEmpty(value, min)) {
    return { key: "validation.recipientMin", vars: { min } };
  }
  return null;
}

export function addressError(
  value: string,
  min = ADDRESS_MIN_LENGTH,
): ValidationIssue | null {
  if (!isNonEmpty(value, min)) {
    return { key: "validation.addressMin", vars: { min } };
  }
  return null;
}

export function messageError(value: string): ValidationIssue | null {
  const trimmed = value.trim();
  if (trimmed.length < MESSAGE_MIN_LENGTH) {
    return { key: "validation.messageMin", vars: { min: MESSAGE_MIN_LENGTH } };
  }
  if (trimmed.length > MESSAGE_MAX_LENGTH) {
    return { key: "validation.messageMax", vars: { max: MESSAGE_MAX_LENGTH } };
  }
  return null;
}

export function confirmPasswordError(
  password: string,
  confirm: string,
): ValidationIssue | null {
  if (!confirm) return { key: "validation.confirmRequired" };
  if (password !== confirm) return { key: "validation.confirmMismatch" };
  return null;
}

export function usernameError(value: string): ValidationIssue | null {
  if (!isNonEmpty(value)) return { key: "validation.usernameRequired" };
  return null;
}

export function formatIssue(
  t: (key: MessageKey, vars?: Record<string, string | number>) => string,
  issue: ValidationIssue | null,
): string | null {
  if (!issue) return null;
  return t(issue.key, issue.vars);
}
