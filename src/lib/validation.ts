/** Client-side form helpers for storefront. */

export const PASSWORD_MIN_LENGTH = 6;
export const NAME_MIN_LENGTH = 2;
export const MESSAGE_MIN_LENGTH = 5;
export const MESSAGE_MAX_LENGTH = 4000;
export const PHONE_MAX_LENGTH = 30;
export const ADDRESS_MIN_LENGTH = 5;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** VN mobile: 0xxxxxxxxx hoặc +84xxxxxxxxx (10 số sau mã vùng). */
const VN_PHONE_RE = /^(?:\+84|84|0)(?:3|5|7|8|9)\d{8}$/;

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

export function passwordError(value: string): string | null {
  if (!value) return "Vui lòng nhập mật khẩu.";
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Mật khẩu tối thiểu ${PASSWORD_MIN_LENGTH} ký tự.`;
  }
  if (value.length > 128) return "Mật khẩu tối đa 128 ký tự.";
  return null;
}

export function emailError(value: string): string | null {
  if (!value.trim()) return "Vui lòng nhập email.";
  if (!isValidEmail(value)) return "Email không hợp lệ.";
  return null;
}

export function phoneError(value: string): string | null {
  if (!value.trim()) return "Vui lòng nhập số điện thoại.";
  if (!isValidVnPhone(value)) {
    return "SĐT không hợp lệ (vd: 0901234567).";
  }
  return null;
}

export function nameError(
  value: string,
  label = "Họ tên",
  min = NAME_MIN_LENGTH,
): string | null {
  if (!isNonEmpty(value, min)) {
    return `${label} tối thiểu ${min} ký tự.`;
  }
  return null;
}

export function confirmPasswordError(
  password: string,
  confirm: string,
): string | null {
  if (!confirm) return "Vui lòng nhập lại mật khẩu.";
  if (password !== confirm) return "Mật khẩu nhập lại không khớp.";
  return null;
}
