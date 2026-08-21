import { inject } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
import { Router } from '@angular/router';
import {
  Observable,
  catchError,
  finalize,
  shareReplay,
  switchMap,
  tap,
  throwError
} from 'rxjs';

import { RefreshTokenResponse } from '../models/auth.model';
import { TokenService } from './token.service';
import { environment } from '../../../../environments/environment';
import { API } from '../constants/api.constants';

let refreshInFlight$: Observable<RefreshTokenResponse> | null = null;

/**
 * Checks whether an outbound HTTP request URL belongs strictly to the Student API domain.
 *
 * Scopes:
 * 1. Core student API: environment.apiBaseUrl (e.g. https://api.mbbs.net/api/v1/...)
 * 2. Admissions student API: ${environment.admissionsApiBaseUrl}/student (e.g. https://api2.mbbs.net/api/v1/student/...)
 *
 * Requests to https://api2.mbbs.net/api/v1/university/... or external resources return false.
 */
export function isStudentApiRequest(url: string): boolean {
  if (!url) {
    return false;
  }

  // 1. Core student API
  if (environment.apiBaseUrl && url.startsWith(environment.apiBaseUrl)) {
    return true;
  }

  // 2. Admissions student API
  const studentAdmissionsPrefix = `${environment.admissionsApiBaseUrl}/student`;
  if (url.startsWith(studentAdmissionsPrefix)) {
    return true;
  }

  return false;
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  // If the request does not target the Student API domain, pass it through directly
  if (!isStudentApiRequest(request.url)) {
    return next(request);
  }

  const refreshUrl = environment.apiBaseUrl + API.AUTH.REFRESH_TOKEN;

  // Do not intercept or add Authorization header to the student refresh-token endpoint
  if (request.url === refreshUrl) {
    return next(request);
  }

  const tokenService = inject(TokenService);
  const http = inject(HttpClient);
  const router = inject(Router);

  const accessToken = tokenService.getAccessToken();

  const authRequest = accessToken
    ? request.clone({
        setHeaders: { Authorization: `Bearer ${accessToken}` }
      })
    : request;

  return next(authRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // If error is not 401 Unauthorized or request has no access token, pass error through
      if (error.status !== 401 || !accessToken) {
        return throwError(() => error);
      }

      const refreshToken = tokenService.getRefreshToken();
      if (!refreshToken) {
        tokenService.clearTokens();
        router.navigate(['/auth/login']);
        return throwError(() => error);
      }

      if (!refreshInFlight$) {
        refreshInFlight$ = http
          .post<RefreshTokenResponse>(refreshUrl, { refreshToken })
          .pipe(
            tap((res) => {
              const data = res?.data;
              if (data?.accessToken && data?.refreshToken) {
                tokenService.updateTokens(data.accessToken, data.refreshToken);
              }
            }),
            finalize(() => {
              refreshInFlight$ = null;
            }),
            shareReplay({ bufferSize: 1, refCount: false })
          );
      }

      return refreshInFlight$.pipe(
        switchMap((res) => {
          const newAccessToken = res?.data?.accessToken || res?.data?.authtoken || '';
          return next(
            request.clone({
              setHeaders: { Authorization: `Bearer ${newAccessToken}` }
            })
          );
        }),
        catchError((refreshError: unknown) => {
          tokenService.clearTokens();
          router.navigate(['/auth/login']);
          return throwError(() => refreshError);
        })
      );
    })
  );
};
