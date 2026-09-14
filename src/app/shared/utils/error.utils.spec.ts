import { extractApiErrorMessage, getApiErrorCode } from './error.utils';

describe('error.utils', () => {
  describe('extractApiErrorMessage', () => {
    it('should extract message from nested error object { error: { code, message } }', () => {
      const err = {
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
        status: 401,
      };
      expect(extractApiErrorMessage(err)).toBe('Invalid email or password.');
    });

    it('should extract message from root message field { status: "fail", message: "..." }', () => {
      const err = {
        error: {
          status: 'fail',
          message: 'Request body contains invalid JSON.',
        },
        status: 400,
      };
      expect(extractApiErrorMessage(err)).toBe(
        'Request body contains invalid JSON.'
      );
    });

    it('should extract message from primitive error field { error: "Custom error text" }', () => {
      const err = {
        error: {
          error: 'Custom error text',
        },
        status: 400,
      };
      expect(extractApiErrorMessage(err)).toBe('Custom error text');
    });

    it('should handle array of validation error messages in message: [...]', () => {
      const err = {
        error: {
          message: ['Email must be valid', 'Password is too short'],
        },
        status: 400,
      };
      expect(extractApiErrorMessage(err)).toBe(
        'Email must be valid, Password is too short'
      );
    });

    it('should handle express-validator array of errors in errors: [{ msg }]', () => {
      const err = {
        error: {
          errors: [
            { msg: 'Invalid university domain' },
            { msg: 'Invalid format' },
          ],
        },
        status: 422,
      };
      expect(extractApiErrorMessage(err)).toBe(
        'Invalid university domain, Invalid format'
      );
    });

    it('should handle string error body', () => {
      const err = {
        error: 'Direct error string from server',
        status: 500,
      };
      expect(extractApiErrorMessage(err)).toBe('Direct error string from server');
    });

    it('should fallback cleanly on HTML error pages without exposing tags', () => {
      const err = {
        error: '<html><body>502 Bad Gateway</body></html>',
        status: 502,
      };
      expect(extractApiErrorMessage(err)).toContain('Bad Gateway');
    });

    it('should fallback based on HTTP status when body is empty', () => {
      const err = {
        error: null,
        status: 404,
      };
      expect(extractApiErrorMessage(err)).toBe(
        'The requested resource or account was not found.'
      );
    });

    it('should NEVER return "[object Object]" under any circumstance', () => {
      const maliciousCases = [
        { error: { error: {} }, status: 500 },
        { error: { error: { code: 123 } }, status: 500 },
        { error: { message: {} }, status: 400 },
        { error: {}, status: 0 },
        '[object Object]',
        { message: '[object Object]' },
      ];

      for (const c of maliciousCases) {
        const result = extractApiErrorMessage(c);
        expect(result).not.toBe('[object Object]');
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getApiErrorCode', () => {
    it('should extract error code from body.error.code', () => {
      const err = {
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Bad credentials',
        },
      };
      expect(getApiErrorCode(err)).toBe('INVALID_CREDENTIALS');
    });

    it('should extract error code from body.code', () => {
      const err = {
        error: {
          code: 'ACTIVE_INVITE_EXISTS',
        },
      };
      expect(getApiErrorCode(err)).toBe('ACTIVE_INVITE_EXISTS');
    });

    it('should return null if no code exists', () => {
      expect(getApiErrorCode({})).toBeNull();
      expect(getApiErrorCode(null)).toBeNull();
    });
  });
});
