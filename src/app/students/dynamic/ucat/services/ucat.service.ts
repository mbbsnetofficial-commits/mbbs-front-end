import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { API } from '../constants/api.constants';
import {
  UcatChaptersRequest,
  UcatChaptersResponse,
  UcatCustomTestDetailResponse,
  UcatCustomTestListResponse,
  UcatCustomTestSaveRequest,
  UcatCustomTestSaveResponse,
  UcatHistoryResponse,
  UcatSaveAnswerRequest,
  UcatSaveAnswerResponse,
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

  getSubjects(): Observable<UcatSubjectsResponse> {
    return this.http.get<UcatSubjectsResponse>(
      `${this.baseUrl}${API.TEST.SUBJECTS}`
    );
  }

  getChapters(data: UcatChaptersRequest): Observable<UcatChaptersResponse> {
    return this.http.post<UcatChaptersResponse>(
      `${this.baseUrl}${API.TEST.CHAPTERS}`,
      data
    );
  }

  getTopics(data: UcatTopicsRequest): Observable<UcatTopicsResponse> {
    return this.http.post<UcatTopicsResponse>(
      `${this.baseUrl}${API.TEST.TOPICS}`,
      data
    );
  }

  saveCustomTest(
    data: UcatCustomTestSaveRequest
  ): Observable<UcatCustomTestSaveResponse> {
    return this.http.post<UcatCustomTestSaveResponse>(
      `${this.baseUrl}${API.TEST.CUSTOM_SAVE}`,
      data
    );
  }

  getCustomTests(): Observable<UcatCustomTestListResponse> {
    return this.http.get<UcatCustomTestListResponse>(
      `${this.baseUrl}${API.TEST.CUSTOM_LIST}`
    );
  }

  getCustomTestById(
    customTestId: number | string
  ): Observable<UcatCustomTestDetailResponse> {
    return this.http.get<UcatCustomTestDetailResponse>(
      `${this.baseUrl}${API.TEST.CUSTOM_DETAIL}/${encodeURIComponent(customTestId)}`
    );
  }

  startTest(data: UcatStartTestRequest): Observable<UcatStartTestResponse> {
    return this.http.post<UcatStartTestResponse>(
      `${this.baseUrl}${API.TEST.START}`,
      data
    );
  }

  saveAnswer(
    sessionId: string,
    data: UcatSaveAnswerRequest
  ): Observable<UcatSaveAnswerResponse> {
    return this.http.patch<UcatSaveAnswerResponse>(
      `${this.baseUrl}${API.TEST.SESSIONS}/${encodeURIComponent(sessionId)}`,
      data
    );
  }

  submitTest(data: UcatSubmitTestRequest): Observable<UcatSubmitTestResponse> {
    return this.http.post<UcatSubmitTestResponse>(
      `${this.baseUrl}${API.TEST.SUBMIT}`,
      data
    );
  }

  getTestResult(sessionId: string): Observable<UcatTestResultResponse> {
    return this.http.get<UcatTestResultResponse>(
      `${this.baseUrl}${API.TEST.SESSIONS}/${encodeURIComponent(sessionId)}/result`
    );
  }

  getTestSession(sessionId: string): Observable<UcatStartTestResponse> {
    return this.http.get<UcatStartTestResponse>(
      `${this.baseUrl}${API.TEST.SESSIONS}/${encodeURIComponent(sessionId)}`
    );
  }

  getHistory(page = 1, limit = 20): Observable<UcatHistoryResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<UcatHistoryResponse>(
      `${this.baseUrl}${API.TEST.HISTORY}`,
      { params }
    );
  }
}
