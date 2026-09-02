import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { API } from '../constants/api.constants';
import {
  GamsatActivityType,
  GamsatRecordStreakRequest,
  GamsatStreakResponse
} from '../models/gamsat-streak.model';

@Injectable({
  providedIn: 'root'
})
export class GamsatStreakService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.gamsatApiBaseUrl;

  getStreak(): Observable<GamsatStreakResponse> {
    return this.http.get<GamsatStreakResponse>(
      `${this.baseUrl}${API.STREAK.BASE}`
    );
  }

  recordActivity(activityType: GamsatActivityType): Observable<GamsatStreakResponse> {
    const payload: GamsatRecordStreakRequest = { activityType };
    return this.http.post<GamsatStreakResponse>(
      `${this.baseUrl}${API.STREAK.RECORD}`,
      payload
    );
  }
}
