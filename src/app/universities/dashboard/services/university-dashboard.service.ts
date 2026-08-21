import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UniversityAuthService } from '../../auth/services/university-auth.service';
import { UNIVERSITY_DASHBOARD_API } from '../constants/university-dashboard.constants';
import {
  DashboardSummary,
  DashboardSummaryResponse,
} from '../models/university-dashboard.model';

@Injectable({ providedIn: 'root' })
export class UniversityDashboardService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(UniversityAuthService);
  private readonly baseUrl = environment.universityApiBaseUrl;

  readonly summary = signal<DashboardSummary | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  loadSummary(): Observable<DashboardSummaryResponse> {
    this.loading.set(true);
    this.error.set(null);

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });

    const url = `${this.baseUrl}${UNIVERSITY_DASHBOARD_API.DASHBOARD_SUMMARY}`;

    return this.http.get<DashboardSummaryResponse>(url, { headers }).pipe(
      tap((res) => {
        if (res?.success && res.data) {
          this.summary.set(res.data);
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

  private extractErrorMessage(err: HttpErrorResponse): string {
    const errorBody = err.error;
    if (errorBody?.message) return errorBody.message;
    if (errorBody?.error?.message) return errorBody.error.message;
    if (typeof errorBody?.error === 'string') return errorBody.error;
    if (typeof errorBody === 'string' && errorBody.trim().length > 0 && errorBody !== err.statusText) {
      return errorBody;
    }

    switch (err.status) {
      case 400:
        return 'Bad request. Unable to load dashboard summary.';
      case 401:
        return 'Session expired or unauthorized. Please sign in again.';
      case 403:
        return 'Access denied. You do not have permission to view organization dashboard metrics.';
      case 404:
        return 'Organization dashboard endpoint not found.';
      case 500:
        return 'Internal server error while fetching dashboard summary. Please try again.';
      default:
        return err.message || 'An unexpected error occurred while loading dashboard metrics.';
    }
  }
}
