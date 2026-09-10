import crypto from 'crypto';

/**
 * Generates a cryptographically secure numeric OTP of given length.
 */
export function generateOtp(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[bytes[i] % 10];
  }
  return otp;
}

/**
 * Returns a future date offset by the given number of minutes from now.
 */
export function expiresInMinutes(minutes: number): Date {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return date;
}

/**
 * Converts a decimal (0–1) to a percentage string.
 * e.g. 0.85 → "85.00%"
 */
export function toPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

/**
 * Calculates progress percentage given completed vs total items.
 */
export function calcProgressPercent(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, parseFloat(((completed / total) * 100).toFixed(2)));
}
