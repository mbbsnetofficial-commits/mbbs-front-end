import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { extractApiErrorMessage } from '../utils/error.utils';

/**
 * Global HTTP error interceptor.
 * Catches any failed HTTP response across all domains (Student, University, Admissions, etc.)
 * and enriches the HttpErrorResponse with a normalized string message.
 * This guarantees that call sites inspecting `err.error?.message` or `(err as any).friendlyMessage`
 * receive a clean, human-readable string and never `[object Object]`.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const cleanMessage = extractApiErrorMessage(error);

        (error as any).friendlyMessage = cleanMessage;

        // If error.error is an object, ensure error.error.message is always a proper string
        if (error.error && typeof error.error === 'object') {
          if (
            typeof error.error.message !== 'string' ||
            !error.error.message.trim() ||
            error.error.message === '[object Object]'
          ) {
            error.error.message = cleanMessage;
          }
        }
      }

      return throwError(() => error);
    })
  );
};
