import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { API } from '../constants/api.constants';
import {
  GamsatSaveAnswerRequest,
  GamsatSaveAnswerResponse,
  GamsatStartTestResponse,
  GamsatSubmitTestRequest,
  GamsatSubmitTestResponse,
  GamsatTestResultResponse
} from '../models/gamsat.model';
import {
  GamsatPreviousYearPaperDetailResponse,
  GamsatPreviousYearPapersResponse,
  GamsatStartPreviousYearTestRequest
} from '../models/gamsat-previous-year.model';

@Injectable({
  providedIn: 'root'
})
export class GamsatPreviousYearService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.gamsatApiBaseUrl;

  getPapers(): Observable<GamsatPreviousYearPapersResponse> {
    return this.http.get<GamsatPreviousYearPapersResponse>(
      `${this.baseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`
    );
  }

  getPaper(paperId: string | number): Observable<GamsatPreviousYearPaperDetailResponse> {
    return this.http.get<GamsatPreviousYearPaperDetailResponse>(
      `${this.baseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}/${encodeURIComponent(paperId)}`
    );
  }

  startPreviousYearTest(
    paperId: string | number,
    payload: GamsatStartPreviousYearTestRequest
  ): Observable<GamsatStartTestResponse> {
    return this.http.post<GamsatStartTestResponse>(
      `${this.baseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}/${encodeURIComponent(paperId)}/start`,
      payload
    );
  }

  getSession(sessionId: string): Observable<GamsatStartTestResponse> {
    return this.http.get<GamsatStartTestResponse>(
      `${this.baseUrl}${API.TEST.SESSIONS}/${encodeURIComponent(sessionId)}`
    );
  }

  saveAnswer(
    sessionId: string,
    data: GamsatSaveAnswerRequest
  ): Observable<GamsatSaveAnswerResponse> {
    const qId = data.questionId ?? data.question_id;
    if (qId === undefined || qId === null || qId === '') {
      console.error('[ GAMSAT ] saveAnswer rejected: questionId is missing', { sessionId, data });
      throw new Error('questionId is required for autosave.');
    }

    const opt = data.selectedOption ?? data.selected_option;
    const time = typeof (data.timeSpent ?? data.time_spent) === 'number' && !isNaN(data.timeSpent ?? data.time_spent!) ? (data.timeSpent ?? data.time_spent!) : 0;

    const payload: GamsatSaveAnswerRequest = {
      questionId: qId,
      selectedOption: opt ?? null,
      timeSpent: time
    };

    return this.http.patch<GamsatSaveAnswerResponse>(
      `${this.baseUrl}${API.TEST.SESSIONS}/${encodeURIComponent(sessionId)}`,
      payload
    );
  }

  submitPreviousYearTest(
    payload: GamsatSubmitTestRequest
  ): Observable<GamsatSubmitTestResponse> {
    return this.http.post<GamsatSubmitTestResponse>(
      `${this.baseUrl}${API.PREVIOUS_YEAR_TEST.SUBMIT}`,
      payload
    );
  }

  getPreviousYearTestResult(
    sessionId: string
  ): Observable<GamsatTestResultResponse> {
    return this.http.get<GamsatTestResultResponse>(
      `${this.baseUrl}${API.TEST.SESSIONS}/${encodeURIComponent(sessionId)}/result`
    );
  }
}
