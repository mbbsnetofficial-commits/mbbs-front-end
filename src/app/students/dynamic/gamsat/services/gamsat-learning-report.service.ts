import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { API } from '../constants/api.constants';
import {
  GamsatLearningReportFiltersResponse,
  GamsatLearningReportQueryParams,
  GamsatLearningReportResponse,
  GamsatSummaryResponse
} from '../models/gamsat-learning-report.model';

@Injectable({
  providedIn: 'root'
})
export class GamsatLearningReportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.gamsatApiBaseUrl;

  getSummary(): Observable<GamsatSummaryResponse> {
    return this.http.get<GamsatSummaryResponse>(
      `${this.baseUrl}${API.STUDENT_DASHBOARD.GAMSAT_SUMMARY}`
    );
  }

  getLearningReport(
    params?: GamsatLearningReportQueryParams
  ): Observable<GamsatLearningReportResponse> {
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
      if (params.section) {
        httpParams = httpParams.set('section', params.section);
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

    return this.http.get<GamsatLearningReportResponse>(
      `${this.baseUrl}${API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT}`,
      { params: httpParams }
    );
  }

  getFilters(): Observable<GamsatLearningReportFiltersResponse> {
    return this.http.get<GamsatLearningReportFiltersResponse>(
      `${this.baseUrl}${API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT_FILTERS}`
    );
  }
}
