import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Author } from '../models/author.model';
import { PageHomeResponse } from '../models/page-home-response.model';

export interface AuthorsListResponse {
  success: boolean;
  message: string;
  data: {
    authors: Author[];
    pagination?: any;
  };
}

@Injectable({ providedIn: 'root' })
export class PageService {
  private readonly http = inject(HttpClient);
  private readonly homeUrl = `${environment.apiBaseUrl}/pages/home`;
  private readonly authorsUrl = `${environment.apiBaseUrl}/pages/authors`;

  getHomePage(page = 1, limit = 10): Observable<PageHomeResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    return this.http.get<PageHomeResponse>(this.homeUrl, { params });
  }

  getAllAuthors(): Observable<AuthorsListResponse> {
    return this.http.get<AuthorsListResponse>(this.authorsUrl);
  }
}
