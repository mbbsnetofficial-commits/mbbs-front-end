import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environments';
import { PageHomeResponse } from '../models/page-home-response.model';

@Injectable({ providedIn: 'root' })
export class PageService {
  private readonly http = inject(HttpClient);
  private readonly homeUrl = `${environment.apiBaseUrl}/pages/home`;

  getHomePage(page = 1, limit = 10): Observable<PageHomeResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    return this.http.get<PageHomeResponse>(this.homeUrl, { params });
  }
}
