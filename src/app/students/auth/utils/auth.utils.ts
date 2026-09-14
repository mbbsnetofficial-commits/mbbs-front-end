/**
 * Utility functions for Student Authentication.
 */

/**
 * Safely extracts or determines the OTP resend cooldown in seconds from an API response or error.
 *
 * MBBS API Specification:
 * - The OTP token itself is valid for 5 minutes (`expiresInMinutes: 5`).
 * - The resend cooldown period is 1 minute (60 seconds).
 *
 * This function ensures that the resend cooldown defaults to 60 seconds (1 minute)
 * and is never mistakenly inflated to 300 seconds (5 minutes) by the OTP token's validity period.
 */
export function extractOtpResendCooldown(res: any): number {
  if (!res) {
    return 60;
  }

  // 1. Check for explicit retry_after_seconds (e.g. from rate-limiting)
  const rawRetry =
    res.retry_after_seconds ??
    res.error?.retry_after_seconds ??
    res.data?.retry_after_seconds ??
    res.data?.resend_interval ??
    res.data?.resend_interval_seconds ??
    res.data?.resendCooldown ??
    res.data?.resendInSeconds;

  if (rawRetry !== undefined && rawRetry !== null) {
    const num = Number(rawRetry);
    if (!isNaN(num) && num > 0) {
      return Math.round(num);
    }
  }

  // 2. Explicit resend minutes field if sent by backend
  const rawResendMins =
    res.resendInMinutes ??
    res.data?.resendInMinutes ??
    res.data?.resend_in_minutes;

  if (rawResendMins !== undefined && rawResendMins !== null) {
    const num = Number(rawResendMins);
    if (!isNaN(num) && num > 0) {
      return Math.min(Math.round(num * 60), 60);
    }
  }

  // 3. If expiresInMinutes is explicitly 1, that corresponds to 60 seconds.
  // If expiresInMinutes is 5 (or any value > 1), it represents the OTP validity,
  // NOT the resend cooldown, so the resend cooldown remains 1 minute (60s).
  const rawExpiryMins = res.data?.expiresInMinutes ?? res.expiresInMinutes;
  if (rawExpiryMins !== undefined && rawExpiryMins !== null) {
    const num = Number(rawExpiryMins);
    if (!isNaN(num) && num === 1) {
      return 60;
    }
  }

  // Default resend cooldown is always 1 minute (60 seconds)
  return 60;
}
