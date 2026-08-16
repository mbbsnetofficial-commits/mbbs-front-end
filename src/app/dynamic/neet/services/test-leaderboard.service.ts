import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../../../environments/environment';
import { API } from '../constants/api.constants';
import {
  MyTestRankResponse,
  TestLeaderboardQuery,
  TestLeaderboardResponse
} from '../models/leaderboard.model';

@Injectable({
  providedIn: 'root'
})
export class TestLeaderboardService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getLeaderboard(query: TestLeaderboardQuery) {
    let params = new HttpParams()
      .set('test_type', query.testType)
      .set('period', query.period)
      .set('page', query.page)
      .set('limit', query.limit);

    if (query.previousYearPaperId !== undefined) {
      params = params.set(
        'previous_year_paper_id',
        query.previousYearPaperId
      );
    }

    return this.http.get<TestLeaderboardResponse>(
      this.baseUrl + API.TEST.LEADERBOARD,
      { params }
    );
  }

  getMyRank(period = 'ALL') {
    return this.http.get<MyTestRankResponse>(
      `${this.baseUrl}${API.TEST.LEADERBOARD}/me`,
      { params: new HttpParams().set('period', period) }
    );
  }
}
