import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { extractApiErrorMessage } from '../../../shared/utils/error.utils';
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
    return extractApiErrorMessage(
      err,
      'An unexpected error occurred while loading dashboard metrics.'
    );
  }
}
