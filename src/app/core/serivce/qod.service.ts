import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environments';
import { API } from '../constants/api.constants';

import {
  QodResponse,
  SubmitQodRequest,
  SubmitQodResponse
} from '../models/qod.model';

@Injectable({
  providedIn: 'root'
})
export class QodService {

  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getQuestionOfTheDay() {
    return this.http.get<QodResponse>(
      this.baseUrl + API.QOD.GET_QUESTION
    );
  }

  submitAnswer(data: SubmitQodRequest) {
    return this.http.post<SubmitQodResponse>(
      this.baseUrl + API.QOD.SUBMIT_ANSWER,
      data
    );
  }

}