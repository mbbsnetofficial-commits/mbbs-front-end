import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';

import { environment } from '../../../../environments/environments';
import {
  UcatChaptersRequest,
  UcatChaptersResponse,
  UcatHistoryResponse,
  UcatStartTestRequest,
  UcatStartTestResponse,
  UcatSubjectsResponse,
  UcatSubmitTestRequest,
  UcatSubmitTestResponse,
  UcatTestResultResponse,
  UcatTopicsRequest,
  UcatTopicsResponse
} from '../models/ucat.model';

@Injectable({
  providedIn: 'root'
})
export class UcatService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  /** Decode the JWT in storage to extract student_id from its claims */
  getStudentIdFromToken(): string | null {
    const token = localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken');
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const pad = parts[1].length % 4;
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/') + (pad ? '='.repeat(4 - pad) : '');
      const claims = JSON.parse(atob(b64)) as Record<string, unknown>;
      console.log('[UCAT Service] JWT claims:', claims);
      const sid = claims['student_id'] ?? claims['studentId'];
      if (typeof sid === 'string' && sid.trim()) return sid.trim();
    } catch (e) {
      console.error('[UCAT Service] JWT decode error:', e);
    }
    return localStorage.getItem('studentId') ?? sessionStorage.getItem('studentId');
  }

  getSubjects(): Observable<UcatSubjectsResponse> {
    return this.http.get<UcatSubjectsResponse>(
      `${this.baseUrl}/ucat/test/subjects`
    );
  }

  getChapters(data: UcatChaptersRequest): Observable<UcatChaptersResponse> {
    return this.http.post<UcatChaptersResponse>(
      `${this.baseUrl}/ucat/test/chapters`,
      data
    );
  }

  getTopics(data: UcatTopicsRequest): Observable<UcatTopicsResponse> {
    return this.http.post<UcatTopicsResponse>(
      `${this.baseUrl}/ucat/test/topics`,
      data
    );
  }

  startTest(data: UcatStartTestRequest): Observable<UcatStartTestResponse> {
    const token = localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken');
    const url = `${this.baseUrl}/ucat/test/start`;
    console.log('[UCAT Service] startTest payload:', JSON.stringify(data));

    const fetchPromise = fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    }).then(async (res) => {
      const json = await res.json();
      console.log('[UCAT Service] startTest response', res.status, json);
      if (!res.ok) {
        const err = { error: json, status: res.status, message: json.message ?? 'Server error' };
        throw err;
      }
      return json as UcatStartTestResponse;
    });

    return from(fetchPromise);
  }

  submitTest(data: UcatSubmitTestRequest): Observable<UcatSubmitTestResponse> {
    return this.http.post<UcatSubmitTestResponse>(
      `${this.baseUrl}/ucat/test/submit`,
      data
    );
  }

  getTestResult(sessionId: string): Observable<UcatTestResultResponse> {
    return this.http.get<UcatTestResultResponse>(
      `${this.baseUrl}/ucat/test/sessions/${encodeURIComponent(sessionId)}/result`
    );
  }

  getTestSession(sessionId: string): Observable<UcatStartTestResponse> {
    return this.http.get<UcatStartTestResponse>(
      `${this.baseUrl}/ucat/test/sessions/${encodeURIComponent(sessionId)}`
    );
  }

  getHistory(page = 1, limit = 20): Observable<UcatHistoryResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<UcatHistoryResponse>(
      `${this.baseUrl}/ucat/test/history`,
      { params }
    );
  }
}
