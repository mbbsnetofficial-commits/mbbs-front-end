import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
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

export interface BlogActionResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/pages/blog`;

  /** GET /api/v1/pages/blog/{slug} */
  getBlogBySlug(slug: string): Observable<BlogSingleResponse> {
    return this.http.get<BlogSingleResponse>(`${this.baseUrl}/${slug}`);
  }

  /** POST /api/v1/blogs/{id}/like */
  likeBlog(id: string): Observable<BlogLikeResponse> {
    return this.http.post<BlogLikeResponse>(`${environment.apiBaseUrl}/blogs/${id}/like`, {});
  }

  /** DELETE /api/v1/blogs/{id}/like */
  unlikeBlog(id: string): Observable<BlogLikeResponse> {
    return this.http.delete<BlogLikeResponse>(`${environment.apiBaseUrl}/blogs/${id}/like`);
  }

  /** POST /api/v1/blogs/{id}/bookmark */
  bookmarkBlog(id: string): Observable<BlogActionResponse> {
    return this.http.post<BlogActionResponse>(`${environment.apiBaseUrl}/blogs/${id}/bookmark`, {});
  }

  /** POST /api/v1/blogs/{id}/save */
  saveBlog(id: string): Observable<BlogActionResponse> {
    return this.http.post<BlogActionResponse>(`${environment.apiBaseUrl}/blogs/${id}/save`, {});
  }
}
