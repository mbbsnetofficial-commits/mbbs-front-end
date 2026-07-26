import { inject } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
import { Router } from '@angular/router';

import { catchError, switchMap, throwError } from 'rxjs';

import { TokenService } from './token.service';
import { environment } from '../../../environments/environments';
import { API } from '../constants/api.constants';

export const authInterceptor: HttpInterceptorFn = (request, next) => {

  const tokenService = inject(TokenService);
  const http = inject(HttpClient);
  const router = inject(Router);

  const accessToken = tokenService.getAccessToken();

  let authRequest = request;

  // Don't attach token to refresh request itself
  if (
    accessToken &&
    !request.url.includes(API.AUTH.REFRESH_TOKEN)
  ) {
    authRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }

  return next(authRequest).pipe(

    catchError((error: HttpErrorResponse) => {

      // Not an unauthorized error
      if (error.status !== 401) {
        return throwError(() => error);
      }

      const refreshToken = tokenService.getRefreshToken();

      if (!refreshToken) {

        tokenService.clearTokens();

        router.navigate(['/']);

        return throwError(() => error);
      }

      // Request a new access token
      return http.post<any>(
        environment.apiBaseUrl + API.AUTH.REFRESH_TOKEN,
        {
          refreshToken
        }
      ).pipe(

        switchMap((response) => {

          tokenService.updateTokens(
            response.data.accessToken,
            response.data.refreshToken
          );

          const retryRequest = request.clone({
            setHeaders: {
              Authorization: `Bearer ${response.data.accessToken}`
            }
          });

          return next(retryRequest);

        }),

        catchError((refreshError) => {

          tokenService.clearTokens();

          router.navigate(['/']);

          return throwError(() => refreshError);

        })

      );

    })

  );

};
