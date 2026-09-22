/**
 * Centralized Form Validation & Input Sanitization Rules
 * CloseUrCase Platform
 */

/** Name Validation: Strings only (Alphabetic letters, spaces, dots, hyphens). No digits or special symbols. */
export const NAME_REGEX = /^[a-zA-Z\s.'-]+$/;

/** Phone Validation: Valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9). */
export const PHONE_REGEX = /^[6-9]\d{9}$/;

/** Email Validation: Standard format (name@domain.com). */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** CNR Number Validation: 16-character alphanumeric eCourts CNR format (e.g., TSHC010011342025). */
export const CNR_REGEX = /^[A-Z0-9]{16}$/;

/**
 * Sanitizes name input in real-time — strips numbers and invalid symbols.
 */
export function sanitizeName(val: string): string {
  return val.replace(/[^a-zA-Z\s.'-]/g, "");
}

/**
 * Sanitizes phone input in real-time — keeps numbers only, max 10 digits.
 */
export function sanitizePhone(val: string): string {
  const digits = val.replace(/\D/g, "");
  return digits.slice(0, 10);
}

/**
 * Sanitizes CNR input in real-time — upper-case alphanumeric only, max 16 chars.
 */
export function sanitizeCNR(val: string): string {
  return val
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 16);
}

/** Validate Name */
export function validateName(name: string): { isValid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: "Name is required." };
  }
  if (!NAME_REGEX.test(trimmed)) {
    return {
      isValid: false,
      error:
        "Name can only contain alphabetic letters and spaces (no numbers or special characters).",
    };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: "Name must be at least 2 characters long." };
  }
  return { isValid: true };
}

/** Validate Phone */
export function validatePhone(phone: string): { isValid: boolean; error?: string } {
  const digits = phone.replace(/\D/g, "");
  if (!digits) {
    return { isValid: false, error: "Phone number is required." };
  }
  if (digits.length !== 10) {
    return { isValid: false, error: "Phone number must be exactly 10 digits." };
  }
  if (!PHONE_REGEX.test(digits)) {
    return {
      isValid: false,
      error: "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.",
    };
  }
  return { isValid: true };
}

/** Validate Email */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  const trimmed = email.trim();
  if (!trimmed) {
    return { isValid: false, error: "Email address is required." };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: "Please enter a valid email address (e.g. name@example.com)." };
  }
  return { isValid: true };
}

/** Validate Phone or Email */
export function validatePhoneOrEmail(val: string): {
  isValid: boolean;
  type: "phone" | "email" | "unknown";
  error?: string;
  cleanedValue: string;
} {
  const trimmed = val.trim();
  if (!trimmed) {
    return {
      isValid: false,
      type: "unknown",
      error: "Mobile number or email address is required.",
      cleanedValue: "",
    };
  }

  if (trimmed.includes("@") || /[a-zA-Z]/.test(trimmed)) {
    const emailRes = validateEmail(trimmed);
    return {
      isValid: emailRes.isValid,
      type: "email",
      error: emailRes.error,
      cleanedValue: trimmed.toLowerCase(),
    };
  }

  const phoneRes = validatePhone(trimmed);
  return {
    isValid: phoneRes.isValid,
    type: "phone",
    error: phoneRes.error,
    cleanedValue: trimmed.replace(/\D/g, "").slice(0, 10),
  };
}

/** Validate CNR Number */
export function validateCNR(cnr: string): { isValid: boolean; error?: string } {
  const sanitized = cnr.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!sanitized) {
    return { isValid: false, error: "CNR number is required." };
  }
  if (sanitized.length !== 16) {
    return {
      isValid: false,
      error: "CNR number must be exactly 16 alphanumeric characters (e.g. TSHC010011342025).",
    };
  }
  return { isValid: true };
}

/** Validate Password */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: "Password is required." };
  }
  if (password.length < 6) {
    return { isValid: false, error: "Password must be at least 6 characters long." };
  }
  return { isValid: true };
}
