import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environments';
import {
  UcatActivityType,
  UcatRecordStreakRequest,
  UcatStreakResponse
} from '../models/ucat-streak.model';

@Injectable({
  providedIn: 'root'
})
export class UcatStreakService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  /** Fetch current streak stats from backend */
  getStreak(): Observable<UcatStreakResponse> {
    return this.http.get<UcatStreakResponse>(
      `${this.baseUrl}/ucat/streaks`
    );
  }

  /** Record a completed learning activity to update streak */
  recordStreak(activityType: UcatActivityType): Observable<UcatStreakResponse> {
    const payload: UcatRecordStreakRequest = { activityType };
    return this.http.post<UcatStreakResponse>(
      `${this.baseUrl}/ucat/streaks/record`,
      payload
    );
  }
}
