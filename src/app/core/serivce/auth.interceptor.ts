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
import { environment } from '../../../environments/environment';
import { API } from '../constants/api.constants';

let refreshInFlight$: Observable<RefreshTokenResponse> | null = null;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const tokenService = inject(TokenService);
  const http = inject(HttpClient);
  const router = inject(Router);
  const refreshUrl = environment.apiBaseUrl + API.AUTH.REFRESH_TOKEN;

  if (request.url === refreshUrl) {
    return next(request);
  }

  const accessToken = tokenService.getAccessToken();

  if (accessToken && accessToken.startsWith('dummy')) {
    const authRequest = request.clone({
      setHeaders: { Authorization: `Bearer ${accessToken}` }
    });
    return next(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error);
      })
    );
  }

  const authRequest = accessToken
    ? request.clone({
        setHeaders: { Authorization: `Bearer ${accessToken}` }
      })
    : request;

  return next(authRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
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
            tap(({ data }) =>
              tokenService.updateTokens(data.accessToken, data.refreshToken)
            ),
            finalize(() => {
              refreshInFlight$ = null;
            }),
            shareReplay({ bufferSize: 1, refCount: false })
          );
      }

      return refreshInFlight$.pipe(
        switchMap(({ data }) =>
          next(
            request.clone({
              setHeaders: { Authorization: `Bearer ${data.accessToken}` }
            })
          )
        ),
        catchError((refreshError: unknown) => {
          tokenService.clearTokens();
          router.navigate(['/auth/login']);
          return throwError(() => refreshError);
        })
      );
    })
  );
};
