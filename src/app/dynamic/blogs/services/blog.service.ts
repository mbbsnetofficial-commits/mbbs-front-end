import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environments';
import { Blog } from '../models/blog.model';

export interface BlogSingleResponse {
  success: boolean;
  message: string;
  data: Blog;
}

export interface BlogLikeResponse {
  success: boolean;
  message: string;
  data: {
    totalLikes: number;
    isLiked?: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/pages/blog`;

  /** GET /api/v1/pages/blog/{slug} */
  getBlogBySlug(slug: string): Observable<BlogSingleResponse> {
    return this.http.get<BlogSingleResponse>(`${this.baseUrl}/${slug}`);
  }

  /** POST /api/v1/pages/blog/{slug}/like */
  likeBlog(slug: string): Observable<BlogLikeResponse> {
    return this.http.post<BlogLikeResponse>(`${this.baseUrl}/${slug}/like`, {});
  }

  /** DELETE /api/v1/pages/blog/{slug}/like */
  unlikeBlog(slug: string): Observable<BlogLikeResponse> {
    return this.http.delete<BlogLikeResponse>(`${this.baseUrl}/${slug}/like`);
  }
}
