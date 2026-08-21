import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import {
  UcatSaveAnswerRequest,
  UcatSaveAnswerResponse,
  UcatStartTestResponse,
  UcatSubmitTestRequest,
  UcatSubmitTestResponse,
  UcatTestResultResponse
} from '../models/ucat.model';
import {
  UcatPreviousYearPapersResponse,
  UcatStartPreviousYearTestRequest
} from '../models/ucat-previous-year.model';

@Injectable({
  providedIn: 'root'
})
export class UcatPreviousYearService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getPreviousYearPapers(): Observable<UcatPreviousYearPapersResponse> {
    return this.http.get<UcatPreviousYearPapersResponse>(
      `${this.baseUrl}/ucat/previous-year-tests`
    );
  }

  startPreviousYearTest(
    paperId: string | number,
    payload: UcatStartPreviousYearTestRequest
  ): Observable<UcatStartTestResponse> {
    return this.http.post<UcatStartTestResponse>(
      `${this.baseUrl}/ucat/previous-year-tests/${encodeURIComponent(paperId)}/start`,
      payload
    );
  }

  saveAnswer(
    sessionId: string,
    data: UcatSaveAnswerRequest
  ): Observable<UcatSaveAnswerResponse> {
    return this.http.patch<UcatSaveAnswerResponse>(
      `${this.baseUrl}/ucat/test/sessions/${encodeURIComponent(sessionId)}`,
      data
    );
  }

  submitPreviousYearTest(
    payload: UcatSubmitTestRequest
  ): Observable<UcatSubmitTestResponse> {
    return this.http.post<UcatSubmitTestResponse>(
      `${this.baseUrl}/ucat/previous-year-tests/submit`,
      payload
    );
  }

  getPreviousYearTestResult(
    sessionId: string
  ): Observable<UcatTestResultResponse> {
    return this.http.get<UcatTestResultResponse>(
      `${this.baseUrl}/ucat/previous-year-tests/sessions/${encodeURIComponent(sessionId)}/result`
    );
  }
}
