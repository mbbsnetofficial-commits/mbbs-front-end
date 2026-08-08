import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { API } from '../constants/api.constants';
import {
  PreviousYearPaperResponse,
  PreviousYearPapersResponse,
  StartPreviousYearTestRequest,
  StartPreviousYearTestResponse,
  SubmitPreviousYearTestRequest,
  SubmitPreviousYearTestResponse
} from '../models/previous-year-test.model';

@Injectable({
  providedIn: 'root'
})
export class PreviousYearTestService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getPapers(examType = 'neet') {
    const params = new HttpParams().set('exam_type', examType);
    return this.http.get<PreviousYearPapersResponse>(
      this.baseUrl + API.PREVIOUS_YEAR_TEST.PAPERS,
      { params }
    );
  }

  getPaper(paperId: number) {
    return this.http.get<PreviousYearPaperResponse>(
      `${this.baseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}/${paperId}`
    );
  }

  startTest(paperId: number, data: StartPreviousYearTestRequest) {
    return this.http.post<StartPreviousYearTestResponse>(
      `${this.baseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}/${paperId}/start`,
      data
    );
  }

  submitTest(data: SubmitPreviousYearTestRequest) {
    return this.http.post<SubmitPreviousYearTestResponse>(
      this.baseUrl + API.PREVIOUS_YEAR_TEST.SUBMIT,
      data
    );
  }
}
