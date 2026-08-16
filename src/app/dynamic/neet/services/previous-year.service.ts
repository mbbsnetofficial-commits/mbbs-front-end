import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../../../environments/environment';
import { API } from '../constants/api.constants';
import {
  BuiltinTestsResponse,
  PreviousYearPaperResponse,
  SubmitPreviousYearTestRequest,
  SubmitPreviousYearTestResponse,
  SaveAnswerRequest,
  SaveAnswerResponse,
  TestSessionResponse,
  TestStartRequest,
  TestStartResponse
} from '../models/previous-year.model';

@Injectable({
  providedIn: 'root'
})
export class PreviousYearTestService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getBuiltinTests() {
    return this.http.get<BuiltinTestsResponse>(
      this.baseUrl + API.TEST.BUILTIN
    );
  }

  getPapers(examType = 'neet') {
    return this.getBuiltinTests();
  }

  getPaper(paperId: number) {
    return this.http.get<PreviousYearPaperResponse>(
      `${this.baseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}/${paperId}`
    );
  }

  startTest(request: TestStartRequest | number) {
    let payload: TestStartRequest;
    if (typeof request === 'number') {
      payload = { builtin_test_id: request };
    } else {
      payload = request;
    }
    return this.http.post<TestStartResponse>(
      this.baseUrl + API.TEST.START,
      payload
    );
  }

  getTestSession(sessionId: string) {
    return this.http.get<TestSessionResponse>(
      `${this.baseUrl}${API.TEST.SESSIONS}/${encodeURIComponent(sessionId)}`
    );
  }

  saveAnswer(sessionId: string, data: SaveAnswerRequest) {
    return this.http.patch<SaveAnswerResponse>(
      `${this.baseUrl}${API.TEST.SESSIONS}/${encodeURIComponent(sessionId)}`,
      data
    );
  }

  submitTest(data: SubmitPreviousYearTestRequest) {
    return this.http.post<SubmitPreviousYearTestResponse>(
      this.baseUrl + API.TEST.SUBMIT,
      data
    );
  }
}
