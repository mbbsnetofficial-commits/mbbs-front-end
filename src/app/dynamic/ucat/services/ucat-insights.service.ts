import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environments';
import {
  UcatGenerateInsightsRequest,
  UcatInsightsResponse
} from '../models/ucat-insights.model';

@Injectable({
  providedIn: 'root'
})
export class UcatInsightsService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  /** Step 1: Trigger Gemini AI analysis generation on backend */
  generateInsights(testSessionId: string): Observable<UcatInsightsResponse> {
    const payload: UcatGenerateInsightsRequest = { testSessionId };
    return this.http.post<UcatInsightsResponse>(
      `${this.baseUrl}/ucat/insights/generate`,
      payload
    );
  }

  /** Step 2: Fetch stored AI insights (Single Source of Truth) */
  getStoredInsights(testSessionId: string): Observable<UcatInsightsResponse> {
    return this.http.get<UcatInsightsResponse>(
      `${this.baseUrl}/ucat/insights/test-zone-insights/${encodeURIComponent(testSessionId)}`
    );
  }
}
