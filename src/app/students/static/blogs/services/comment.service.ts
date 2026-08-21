import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import {
  CommentDeleteResponse,
  CommentLikeResponse,
  CommentListResponse,
  CommentSingleResponse
} from '../models/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly http = inject(HttpClient);

  private url(slug: string, ...parts: string[]): string {
    return [`${environment.apiBaseUrl}/pages/blog`, slug, 'comments', ...parts]
      .filter(Boolean)
      .join('/');
  }

  /** GET /api/v1/pages/blog/{slug}/comments?page=1&limit=10 */
  getComments(slug: string, page = 1, limit = 10): Observable<CommentListResponse> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<CommentListResponse>(this.url(slug), { params });
  }

  /** POST /api/v1/pages/blog/{slug}/comments */
  postComment(slug: string, comment: string): Observable<CommentSingleResponse> {
    return this.http.post<CommentSingleResponse>(this.url(slug), { comment });
  }

  /** PATCH /api/v1/pages/blog/{slug}/comments/{commentId} */
  updateComment(slug: string, commentId: string, comment: string): Observable<CommentSingleResponse> {
    return this.http.patch<CommentSingleResponse>(this.url(slug, commentId), { comment });
  }

  /** DELETE /api/v1/pages/blog/{slug}/comments/{commentId} */
  deleteComment(slug: string, commentId: string): Observable<CommentDeleteResponse> {
    return this.http.delete<CommentDeleteResponse>(this.url(slug, commentId));
  }

  /** POST /api/v1/pages/blog/{slug}/comments/{commentId}/like */
  likeComment(slug: string, commentId: string): Observable<CommentLikeResponse> {
    return this.http.post<CommentLikeResponse>(this.url(slug, commentId, 'like'), {});
  }

  /** DELETE /api/v1/pages/blog/{slug}/comments/{commentId}/like */
  unlikeComment(slug: string, commentId: string): Observable<CommentLikeResponse> {
    return this.http.delete<CommentLikeResponse>(this.url(slug, commentId, 'like'));
  }
}
