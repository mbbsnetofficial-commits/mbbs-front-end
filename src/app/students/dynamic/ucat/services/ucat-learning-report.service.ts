import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { API } from '../constants/api.constants';
import {
  UcatLearningReportQueryParams,
  UcatLearningReportResponse,
  UcatSummaryResponse
} from '../models/ucat-learning-report.model';

@Injectable({
  providedIn: 'root'
})
export class UcatLearningReportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getUcatSummary(): Observable<UcatSummaryResponse> {
    return this.http.get<UcatSummaryResponse>(
      `${this.baseUrl}${API.STUDENT_DASHBOARD.UCAT_SUMMARY}`
    );
  }

  getUcatLearningReport(
    params?: UcatLearningReportQueryParams
  ): Observable<UcatLearningReportResponse> {
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

    return this.http.get<UcatLearningReportResponse>(
      `${this.baseUrl}${API.STUDENT_DASHBOARD.UCAT_LEARNING_REPORT}`,
      { params: httpParams }
    );
  }

  getBuiltinTests(): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}${API.TEST.BUILTIN}`
    );
  }
}
