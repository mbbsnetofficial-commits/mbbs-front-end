import { extractOtpResendCooldown } from './auth.utils';

describe('extractOtpResendCooldown', () => {
  it('should default to 60 seconds when response is null or undefined', () => {
    expect(extractOtpResendCooldown(null)).toBe(60);
    expect(extractOtpResendCooldown(undefined)).toBe(60);
    expect(extractOtpResendCooldown({})).toBe(60);
  });

  it('should return 60 seconds when API response has expiresInMinutes: 5 (OTP validity)', () => {
    const res = {
      status: 'success',
      message: "We've sent a verification code to your WhatsApp.",
      data: { phoneNumber: '+919444308959', expiresInMinutes: 5 }
    };
    expect(extractOtpResendCooldown(res)).toBe(60);
  });

  it('should return 60 seconds when API response has expiresInMinutes: 1', () => {
    const res = {
      status: 'success',
      message: "We've sent a verification code to your WhatsApp.",
      data: { phoneNumber: '+919444308959', expiresInMinutes: 1 }
    };
    expect(extractOtpResendCooldown(res)).toBe(60);
  });

  it('should extract retry_after_seconds from root', () => {
    const res = {
      status: 'fail',
      message: 'Please wait 11 seconds before requesting another code.',
      retry_after_seconds: 11
    };
    expect(extractOtpResendCooldown(res)).toBe(11);
  });

  it('should extract retry_after_seconds from error object', () => {
    const err = {
      error: {
        message: 'Rate limited',
        retry_after_seconds: 24
      }
    };
    expect(extractOtpResendCooldown(err)).toBe(24);
  });

  it('should extract resendCooldown from data object', () => {
    const res = {
      data: {
        resendCooldown: 45
      }
    };
    expect(extractOtpResendCooldown(res)).toBe(45);
  });

  it('should handle resendInMinutes', () => {
    const res = {
      data: {
        resendInMinutes: 1
      }
    };
    expect(extractOtpResendCooldown(res)).toBe(60);
  });
});
