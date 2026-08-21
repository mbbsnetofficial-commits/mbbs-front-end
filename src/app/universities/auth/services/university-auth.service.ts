import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  UNIVERSITY_AUTH_API,
  UNIVERSITY_STORAGE_KEYS,
} from '../constants/university-auth.constants';
import {
  ResetPasswordRequest,
  ResetPasswordResponse,
  UniversityAuthResponse,
  UniversityIdentity,
  UniversityLoginRequest,
  UniversityLogoutResponse,
} from '../models/university-auth.model';

@Injectable({ providedIn: 'root' })
export class UniversityAuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.universityApiBaseUrl;

  readonly loading = signal<boolean>(false);
  readonly logoutLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly currentUser = signal<UniversityIdentity | null>(
    this.getStoredIdentity()
  );

  readonly isAuthenticated = computed(() => {
    return !!this.getToken() && !!this.currentUser();
  });

  login(payload: UniversityLoginRequest): Observable<UniversityAuthResponse> {
    this.loading.set(true);
    this.error.set(null);

    const url = `${this.baseUrl}${UNIVERSITY_AUTH_API.LOGIN}`;

    return this.http.post<UniversityAuthResponse>(url, payload).pipe(
      tap((res) => {
        if (res?.success && res.data?.token && res.data.university) {
          this.setSession(res.data.token, res.data.university);
        }
        this.loading.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        const errorMsg = this.extractErrorMessage(err);
        this.error.set(errorMsg);
        this.loading.set(false);
        return throwError(() => err);
      })
    );
  }

  logout(): Observable<UniversityLogoutResponse> {
    const token = this.getToken();
    const url = `${this.baseUrl}${UNIVERSITY_AUTH_API.LOGOUT}`;

    if (!token) {
      this.clearSession();
      return of({
        success: true,
        message: 'Session cleared locally.',
      });
    }

    if (this.logoutLoading()) {
      return of({
        success: true,
        message: 'Logout already in progress.',
      });
    }

    this.logoutLoading.set(true);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.post<UniversityLogoutResponse>(url, {}, { headers }).pipe(
      tap((res) => {
        this.clearSession();
        this.logoutLoading.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        // Clear local session on 401, session-not-found, or server errors
        this.clearSession();
        this.logoutLoading.set(false);

        return of({
          success: false,
          message: this.extractErrorMessage(err),
        });
      })
    );
  }

  resetPassword(
    payload: ResetPasswordRequest
  ): Observable<ResetPasswordResponse> {
    this.loading.set(true);
    this.error.set(null);

    const url = `${this.baseUrl}${UNIVERSITY_AUTH_API.RESET_PASSWORD}`;

    return this.http.post<ResetPasswordResponse>(url, payload).pipe(
      tap(() => {
        this.loading.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        const errorMsg = this.extractErrorMessage(err);
        this.error.set(errorMsg);
        this.loading.set(false);
        return throwError(() => err);
      })
    );
  }

  getToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(UNIVERSITY_STORAGE_KEYS.ACCESS_TOKEN);
  }

  getStoredIdentity(): UniversityIdentity | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(UNIVERSITY_STORAGE_KEYS.IDENTITY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UniversityIdentity;
    } catch {
      return null;
    }
  }

  setSession(token: string, identity: UniversityIdentity): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(UNIVERSITY_STORAGE_KEYS.ACCESS_TOKEN, token);
      localStorage.setItem(
        UNIVERSITY_STORAGE_KEYS.IDENTITY,
        JSON.stringify(identity)
      );
    }
    this.currentUser.set(identity);
  }

  clearSession(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(UNIVERSITY_STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(UNIVERSITY_STORAGE_KEYS.IDENTITY);
    }
    this.currentUser.set(null);
    this.error.set(null);
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    const errorBody = err.error;
    if (typeof errorBody === 'string') return errorBody;
    if (errorBody?.message) return errorBody.message;
    if (errorBody?.error?.message) return errorBody.error.message;
    if (errorBody?.error) return errorBody.error;

    switch (err.status) {
      case 400:
        return 'Invalid request data. Please check the entered information.';
      case 401:
        return 'Invalid university credentials or session expired.';
      case 403:
        return 'Access denied. Your university account may be suspended or disabled.';
      case 404:
        return 'University resource or account not found.';
      case 500:
        return 'Internal server error. Please try again later.';
      default:
        return err.message || 'An unexpected error occurred.';
    }
  }
}
