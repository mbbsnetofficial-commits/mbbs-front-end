import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { API } from '../constants/api.constants';
import {
  LearningReportQueryParams,
  LearningReportResponse,
  NeetSummaryResponse
} from '../models/learning-report.model';

@Injectable({
  providedIn: 'root'
})
export class LearningReportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getNeetSummary(studentId?: string): Observable<NeetSummaryResponse> {
    let httpParams = new HttpParams();
    if (studentId) {
      httpParams = httpParams.set('student_id', studentId);
    }
    return this.http.get<NeetSummaryResponse>(
      `${this.baseUrl}${API.STUDENT_DASHBOARD.NEET_SUMMARY}`,
      { params: httpParams }
    );
  }

  getLearningReport(
    params?: LearningReportQueryParams
  ): Observable<LearningReportResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.status && params.status !== 'all') {
        httpParams = httpParams.set('status', params.status);
      }
      if (params.source && params.source !== 'all') {
        httpParams = httpParams.set('source', params.source);
      }
      if (params.type) {
        httpParams = httpParams.set('type', params.type);
      }
      if (params.sortBy) {
        httpParams = httpParams.set('sortBy', params.sortBy);
      }
      if (params.sortOrder) {
        httpParams = httpParams.set('sortOrder', params.sortOrder);
      }
      if (params.page !== undefined) {
        httpParams = httpParams.set('page', params.page.toString());
      }
      if (params.limit !== undefined) {
        httpParams = httpParams.set('limit', params.limit.toString());
      }
    }

    return this.http.get<LearningReportResponse>(
      `${this.baseUrl}${API.STUDENT_DASHBOARD.NEET_LEARNING_REPORT}`,
      { params: httpParams }
    );
  }
}
