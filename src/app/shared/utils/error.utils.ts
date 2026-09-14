/**
 * Centralized API Error Extraction Utility.
 * Guarantees a human-readable string is ALWAYS returned and never an object, array, or '[object Object]'.
 */

/**
 * Safely extracts an error code string (e.g. 'INVALID_CREDENTIALS', 'ACTIVE_INVITE_EXISTS')
 * from an API error response, or returns null if not present.
 */
export function getApiErrorCode(err: unknown): string | null {
  if (!err || typeof err !== 'object') {
    return null;
  }

  const anyErr = err as any;
  const body = anyErr.error !== undefined ? anyErr.error : anyErr.response?.data;

  if (body && typeof body === 'object') {
    if (typeof body.error?.code === 'string' && body.error.code.trim()) {
      return body.error.code.trim();
    }
    if (typeof body.code === 'string' && body.code.trim()) {
      return body.code.trim();
    }
    if (typeof body.errorCode === 'string' && body.errorCode.trim()) {
      return body.errorCode.trim();
    }
  }

  if (typeof anyErr.code === 'string' && anyErr.code.trim()) {
    return anyErr.code.trim();
  }

  return null;
}

/**
 * Extracts a human-readable error message from any API error, HttpErrorResponse,
 * Error object, or unknown exception.
 */
export function extractApiErrorMessage(
  err: unknown,
  fallbackMessage = 'An unexpected error occurred. Please try again.'
): string {
  if (!err) {
    return fallbackMessage;
  }

  // If already a primitive string
  if (typeof err === 'string') {
    const trimmed = err.trim();
    if (trimmed && trimmed !== '[object Object]') {
      return cleanErrorMessage(trimmed, fallbackMessage);
    }
    return fallbackMessage;
  }

  const anyErr = err as any;

  // Potential places where error details might reside
  const body = anyErr.error !== undefined ? anyErr.error : anyErr.response?.data;

  // 1. If the body is a string (e.g. plain text response, HTML from 502/504)
  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (trimmed && trimmed !== '[object Object]') {
      // If it looks like HTML (e.g., standard Nginx/Cloudflare 502/503/504 pages), don't show HTML tags
      if (trimmed.startsWith('<') && trimmed.includes('>')) {
        return getStatusFallback(anyErr.status, fallbackMessage);
      }
      return cleanErrorMessage(trimmed, fallbackMessage);
    }
  }

  // 2. If the body is an object or array
  if (body && typeof body === 'object') {
    // Case A: Body is an array of errors or strings
    if (Array.isArray(body) && body.length > 0) {
      const messages = body
        .map((item) => extractFromSingleItem(item))
        .filter((m): m is string => typeof m === 'string' && m.length > 0);
      if (messages.length > 0) {
        return messages.join(', ');
      }
    }

    // Case B: body.error is an object containing message (e.g. { error: { code: '...', message: '...' } })
    if (body.error && typeof body.error === 'object') {
      const nestedMsg =
        extractString(body.error.message) ||
        extractString(body.error.msg) ||
        extractString(body.error.detail) ||
        extractString(body.error.description);
      if (nestedMsg) {
        return cleanErrorMessage(nestedMsg, fallbackMessage);
      }
      if (Array.isArray(body.error.errors) && body.error.errors.length > 0) {
        const msgs = body.error.errors
          .map((item: any) => extractFromSingleItem(item))
          .filter((m: any): m is string => typeof m === 'string' && m.length > 0);
        if (msgs.length > 0) {
          return msgs.join(', ');
        }
      }
    }

    // Case C: body.message (string, array, or nested)
    if (body.message !== undefined && body.message !== null) {
      if (typeof body.message === 'string') {
        const clean = extractString(body.message);
        if (clean) return cleanErrorMessage(clean, fallbackMessage);
      } else if (Array.isArray(body.message) && body.message.length > 0) {
        // NestJS validation error style: { message: ['email must be an email', ...] }
        const msgs = body.message
          .map((m: any) => extractFromSingleItem(m))
          .filter((m: any): m is string => typeof m === 'string' && m.length > 0);
        if (msgs.length > 0) {
          return msgs.join(', ');
        }
      } else if (typeof body.message === 'object') {
        const nested =
          extractString(body.message.message) ||
          extractString(body.message.msg) ||
          extractString(body.message.detail);
        if (nested) return cleanErrorMessage(nested, fallbackMessage);
      }
    }

    // Case D: body.error is a primitive string
    if (typeof body.error === 'string') {
      const clean = extractString(body.error);
      if (clean) return cleanErrorMessage(clean, fallbackMessage);
    }

    // Case E: body.errors (common in express-validator, ASP.NET, DRF)
    if (Array.isArray(body.errors) && body.errors.length > 0) {
      const msgs = body.errors
        .map((item: any) => extractFromSingleItem(item))
        .filter((m: any): m is string => typeof m === 'string' && m.length > 0);
      if (msgs.length > 0) {
        return msgs.join(', ');
      }
    } else if (body.errors && typeof body.errors === 'object') {
      const firstKey = Object.keys(body.errors)[0];
      const val = body.errors[firstKey];
      if (typeof val === 'string') {
        return cleanErrorMessage(val, fallbackMessage);
      }
      if (Array.isArray(val) && typeof val[0] === 'string') {
        return cleanErrorMessage(val[0], fallbackMessage);
      }
    }

    // Case F: body.detail or body.msg
    const directDetail = extractString(body.detail) || extractString(body.msg);
    if (directDetail) {
      return cleanErrorMessage(directDetail, fallbackMessage);
    }
  }

  // 3. Fallback based on HTTP status code (if present)
  if (typeof anyErr.status === 'number' && anyErr.status > 0) {
    const statusText = getStatusFallback(anyErr.status, '');
    if (statusText) {
      return statusText;
    }
  }

  // 4. Check top-level message (e.g. standard Error instance)
  if (typeof anyErr.message === 'string') {
    const msg = anyErr.message.trim();
    // Ignore generic Angular Http failure message that doesn't help users
    if (
      msg &&
      msg !== '[object Object]' &&
      !msg.startsWith('Http failure response for')
    ) {
      return cleanErrorMessage(msg, fallbackMessage);
    }
  }

  return fallbackMessage;
}

function extractString(val: unknown): string | null {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed && trimmed !== '[object Object]') {
      return trimmed;
    }
  }
  return null;
}

function extractFromSingleItem(item: unknown): string | null {
  if (typeof item === 'string') {
    return extractString(item);
  }
  if (item && typeof item === 'object') {
    const obj = item as any;
    return (
      extractString(obj.message) ||
      extractString(obj.msg) ||
      extractString(obj.error) ||
      extractString(obj.detail)
    );
  }
  return null;
}

function cleanErrorMessage(msg: string, fallback: string): string {
  const trimmed = msg.trim();
  if (!trimmed || trimmed === '[object Object]') {
    return fallback;
  }
  return trimmed;
}

function getStatusFallback(status: number, fallback: string): string {
  switch (status) {
    case 400:
      return 'Invalid request data. Please check your entered information.';
    case 401:
      return 'Unauthorized. Please check your credentials or sign in again.';
    case 403:
      return 'Access denied. You do not have permission to perform this action.';
    case 404:
      return 'The requested resource or account was not found.';
    case 409:
      return 'Conflict. A record with this information already exists.';
    case 422:
      return 'Validation failed. Please verify the submitted information.';
    case 429:
      return 'Too many requests. Please wait a moment before trying again.';
    case 500:
      return 'Internal server error. Please try again later.';
    case 502:
      return 'Server is temporarily unavailable (Bad Gateway). Please try again later.';
    case 503:
      return 'Service is temporarily unavailable. Please try again shortly.';
    case 504:
      return 'Server request timed out. Please try again later.';
    default:
      return fallback;
  }
}
