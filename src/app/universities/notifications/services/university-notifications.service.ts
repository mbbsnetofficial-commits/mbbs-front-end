import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UniversityAuthService } from '../../auth/services/university-auth.service';
import { UNIVERSITY_NOTIFICATIONS_API } from '../constants/university-notifications.constants';
import {
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
  NotificationListParams,
  UniversityNotification,
  UniversityNotificationListResponse,
  UniversityNotificationPagination,
  UniversityUnreadNotificationCountResponse,
} from '../models/university-notification.model';

@Injectable({ providedIn: 'root' })
export class UniversityNotificationsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(UniversityAuthService);
  private readonly baseUrl = environment.universityApiBaseUrl;

  readonly notifications = signal<UniversityNotification[]>([]);
  readonly pagination = signal<UniversityNotificationPagination | null>(null);
  readonly unreadCount = signal<number>(0);

  readonly loading = signal<boolean>(false);
  readonly countLoading = signal<boolean>(false);
  readonly markingReadId = signal<string | null>(null);
  readonly markingAllRead = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly countError = signal<string | null>(null);

  // API #13: GET /organization/notifications (List Notifications)
  getNotifications(
    params?: NotificationListParams
  ): Observable<UniversityNotificationListResponse> {
    this.loading.set(true);
    this.error.set(null);

    let httpParams = new HttpParams();
    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    } else {
      httpParams = httpParams.set('page', '1');
    }

    if (params?.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit.toString());
    } else {
      httpParams = httpParams.set('limit', '20');
    }

    if (params?.unreadOnly !== undefined) {
      httpParams = httpParams.set('unreadOnly', params.unreadOnly.toString());
    }

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });

    const url = `${this.baseUrl}${UNIVERSITY_NOTIFICATIONS_API.LIST}`;

    return this.http
      .get<UniversityNotificationListResponse>(url, { headers, params: httpParams })
      .pipe(
        tap((res) => {
          if (res?.success && res.data) {
            if (Array.isArray(res.data)) {
              this.notifications.set(res.data);
              this.pagination.set(null);
            } else if ('items' in res.data && Array.isArray(res.data.items)) {
              this.notifications.set(res.data.items);
              this.pagination.set(res.data.pagination || null);
            } else {
              this.notifications.set([]);
              this.pagination.set(null);
            }
          }
          this.loading.set(false);
        }),
        catchError((err: HttpErrorResponse) => {
          const errorMsg = this.extractErrorMessage(err, 'list');
          this.error.set(errorMsg);
          this.loading.set(false);
          return throwError(() => err);
        })
      );
  }

  // API #14: GET /organization/notifications/unread-count (Unread Notification Count)
  getUnreadCount(): Observable<UniversityUnreadNotificationCountResponse> {
    this.countLoading.set(true);
    this.countError.set(null);

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });

    const url = `${this.baseUrl}${UNIVERSITY_NOTIFICATIONS_API.UNREAD_COUNT}`;

    return this.http
      .get<UniversityUnreadNotificationCountResponse>(url, { headers })
      .pipe(
        tap((res) => {
          if (res?.success && res.data && typeof res.data.count === 'number') {
            this.unreadCount.set(res.data.count);
          }
          this.countLoading.set(false);
        }),
        catchError((err: HttpErrorResponse) => {
          const errorMsg = this.extractErrorMessage(err, 'count');
          this.countError.set(errorMsg);
          this.countLoading.set(false);
          return throwError(() => err);
        })
      );
  }

  // API #15: PATCH /organization/notifications/:notificationId/read (Mark Single Notification as Read)
  markAsRead(
    notificationId: string
  ): Observable<MarkNotificationReadResponse> {
    this.markingReadId.set(notificationId);
    this.error.set(null);

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });

    const url = `${this.baseUrl}${UNIVERSITY_NOTIFICATIONS_API.MARK_READ(notificationId)}`;

    return this.http
      .patch<MarkNotificationReadResponse>(url, null, { headers })
      .pipe(
        tap((res) => {
          if (res?.success) {
            const updated = this.notifications().map((n) =>
              n._id === notificationId
                ? {
                    ...n,
                    read: true,
                    readAt: res.data?.readAt || new Date().toISOString(),
                  }
                : n
            );
            this.notifications.set(updated);
            // Synchronize trusted unread count from API #14
            this.getUnreadCount().subscribe({ error: () => {} });
          }
          this.markingReadId.set(null);
        }),
        catchError((err: HttpErrorResponse) => {
          const errorMsg = this.extractErrorMessage(err, 'mark-read');
          this.error.set(errorMsg);
          this.markingReadId.set(null);
          return throwError(() => err);
        })
      );
  }

  // API #16: PATCH /organization/notifications/read-all (Mark All Notifications as Read)
  markAllAsRead(): Observable<MarkAllNotificationsReadResponse> {
    this.markingAllRead.set(true);
    this.error.set(null);

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });

    const url = `${this.baseUrl}${UNIVERSITY_NOTIFICATIONS_API.MARK_ALL_READ}`;

    return this.http
      .patch<MarkAllNotificationsReadResponse>(url, null, { headers })
      .pipe(
        tap((res) => {
          if (res?.success) {
            const updated = this.notifications().map((n) => ({
              ...n,
              read: true,
            }));
            this.notifications.set(updated);
            // Synchronize trusted unread count from API #14
            this.getUnreadCount().subscribe({ error: () => {} });
          }
          this.markingAllRead.set(false);
        }),
        catchError((err: HttpErrorResponse) => {
          const errorMsg = this.extractErrorMessage(err, 'mark-all');
          this.error.set(errorMsg);
          this.markingAllRead.set(false);
          return throwError(() => err);
        })
      );
  }

  private extractErrorMessage(
    err: HttpErrorResponse,
    action: 'list' | 'count' | 'mark-read' | 'mark-all' = 'list'
  ): string {
    const errorBody = err.error;
    if (errorBody?.message) return errorBody.message;
    if (errorBody?.error?.message) return errorBody.error.message;
    if (typeof errorBody?.error === 'string') return errorBody.error;
    if (
      typeof errorBody === 'string' &&
      errorBody.trim().length > 0 &&
      errorBody !== err.statusText
    ) {
      return errorBody;
    }

    switch (err.status) {
      case 400:
        return 'Bad request. Invalid notification request.';
      case 401:
        return 'Session expired or unauthorized. Please sign in again.';
      case 403:
        return 'Access denied. You do not have permission to modify organization notifications.';
      case 404:
        return action === 'count'
          ? 'Notification unread count resource not found.'
          : action === 'mark-read'
            ? 'Notification not found or already processed.'
            : 'The notifications resource was not found.';
      case 409:
        return 'Conflict updating notification status.';
      case 500:
        return 'Internal server error while processing notifications. Please try again.';
      default:
        return (
          err.message ||
          'An unexpected error occurred while communicating with notifications backend.'
        );
    }
  }
}
