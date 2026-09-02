import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { API } from '../constants/api.constants';
import {
  GamsatApiResponse,
  GamsatBuiltinTestsResponse,
  GamsatCustomTestSaveRequest,
  GamsatCustomTestSaveResponse,
  GamsatFiltersResponse,
  GamsatHistoryResponse,
  GamsatQuestion,
  GamsatQuestionQueryParams,
  GamsatSaveAnswerRequest,
  GamsatSaveAnswerResponse,
  GamsatSectionsResponse,
  GamsatStartTestRequest,
  GamsatStartTestResponse,
  GamsatSubmitTestRequest,
  GamsatSubmitTestResponse,
  GamsatTestResultResponse,
  GamsatTopicsRequest,
  GamsatTopicsResponse
} from '../models/gamsat.model';

@Injectable({
  providedIn: 'root'
})
export class GamsatService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.gamsatApiBaseUrl;

  getSections(): Observable<GamsatSectionsResponse> {
    return this.http.get<GamsatSectionsResponse>(
      `${this.baseUrl}${API.TEST.SECTIONS}`
    );
  }

  getTopics(data?: GamsatTopicsRequest): Observable<GamsatTopicsResponse> {
    let params = new HttpParams();
    if (data?.section) {
      params = params.set('section', data.section);
    }
    if (data?.unit) {
      params = params.set('unit', data.unit);
    }
    return this.http.get<GamsatTopicsResponse>(
      `${this.baseUrl}${API.TEST.TOPICS}`,
      { params }
    );
  }

  getFilters(): Observable<GamsatFiltersResponse> {
    return this.http.get<GamsatFiltersResponse>(
      `${this.baseUrl}${API.TEST.FILTERS}`
    );
  }

  getQuestions(params?: GamsatQuestionQueryParams): Observable<GamsatApiResponse<GamsatQuestion[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get<GamsatApiResponse<GamsatQuestion[]>>(
      `${this.baseUrl}${API.TEST.QUESTIONS}`,
      { params: httpParams }
    );
  }

  getBuiltinTests(): Observable<GamsatBuiltinTestsResponse> {
    return this.http.get<GamsatBuiltinTestsResponse>(
      `${this.baseUrl}${API.TEST.BUILTIN}`
    );
  }

  saveCustomTest(
    data: GamsatCustomTestSaveRequest
  ): Observable<GamsatCustomTestSaveResponse> {
    return this.http.post<GamsatCustomTestSaveResponse>(
      `${this.baseUrl}${API.TEST.CUSTOM_SAVE}`,
      data
    );
  }

  startTest(data: GamsatStartTestRequest): Observable<GamsatStartTestResponse> {
    return this.http.post<GamsatStartTestResponse>(
      `${this.baseUrl}${API.TEST.START}`,
      data
    );
  }

  getTestSession(sessionId: string): Observable<GamsatStartTestResponse> {
    return this.http.get<GamsatStartTestResponse>(
      `${this.baseUrl}${API.TEST.SESSIONS}/${encodeURIComponent(sessionId)}`
    );
  }

  getSession(sessionId: string): Observable<GamsatStartTestResponse> {
    return this.getTestSession(sessionId);
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

  submitTest(data: GamsatSubmitTestRequest): Observable<GamsatSubmitTestResponse> {
    return this.http.post<GamsatSubmitTestResponse>(
      `${this.baseUrl}${API.TEST.SUBMIT}`,
      data
    );
  }

  getTestResult(sessionId: string): Observable<GamsatTestResultResponse> {
    return this.http.get<GamsatTestResultResponse>(
      `${this.baseUrl}${API.TEST.SESSIONS}/${encodeURIComponent(sessionId)}/result`
    );
  }

  getHistory(page = 1, limit = 20): Observable<GamsatHistoryResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<GamsatHistoryResponse>(
      `${this.baseUrl}${API.TEST.HISTORY}`,
      { params }
    );
  }
}
