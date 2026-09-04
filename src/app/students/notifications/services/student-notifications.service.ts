import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { STUDENT_NOTIFICATIONS_API } from '../constants/student-notifications.constants';
import {
  CreateStudentNotificationPayload,
  StudentNotification,
  StudentNotificationActionResponse,
  StudentNotificationDismissResponse,
  StudentNotificationListParams,
  StudentNotificationListResponse,
  StudentNotificationReadAllResponse,
  StudentNotificationUnreadCountResponse,
} from '../models/student-notification.model';

@Injectable({ providedIn: 'root' })
export class StudentNotificationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  readonly notifications = signal<StudentNotification[]>([]);
  readonly unreadCount = signal<number>(0);
  readonly total = signal<number>(0);
  readonly page = signal<number>(1);
  readonly totalPages = signal<number>(1);

  readonly loading = signal<boolean>(false);
  readonly countLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly countError = signal<string | null>(null);

  /**
   * 1. List user notifications with optional pagination and filters.
   * GET /api/v1/notifications
   */
  getNotifications(
    params?: StudentNotificationListParams
  ): Observable<StudentNotificationListResponse> {
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

    if (params?.is_read !== undefined) {
      httpParams = httpParams.set('is_read', params.is_read.toString());
    }

    if (params?.notification_type !== undefined) {
      httpParams = httpParams.set('notification_type', params.notification_type);
    }

    const url = `${this.baseUrl}${STUDENT_NOTIFICATIONS_API.LIST}`;

    return this.http
      .get<StudentNotificationListResponse>(url, { params: httpParams })
      .pipe(
        tap((res) => {
          if (res?.data && Array.isArray(res.data)) {
            this.notifications.set(res.data);
            this.total.set(res.total ?? res.data.length);
            this.page.set(res.page ?? 1);
            this.totalPages.set(res.totalPages ?? 1);
          } else {
            this.notifications.set([]);
          }
          this.loading.set(false);
        }),
        catchError((err: HttpErrorResponse) => {
          const errorMsg =
            err.error?.message ||
            err.error?.error ||
            'Failed to load notifications.';
          this.error.set(errorMsg);
          this.loading.set(false);
          return throwError(() => err);
        })
      );
  }

  /**
   * 2. Get unread notification count.
   * GET /api/v1/notifications/unread-count
   */
  getUnreadCount(): Observable<StudentNotificationUnreadCountResponse> {
    this.countLoading.set(true);
    this.countError.set(null);

    const url = `${this.baseUrl}${STUDENT_NOTIFICATIONS_API.UNREAD_COUNT}`;

    return this.http
      .get<StudentNotificationUnreadCountResponse>(url)
      .pipe(
        tap((res) => {
          const count = res?.data?.unread_count ?? 0;
          this.unreadCount.set(count);
          this.countLoading.set(false);
        }),
        catchError((err: HttpErrorResponse) => {
          const errorMsg =
            err.error?.message ||
            err.error?.error ||
            'Failed to load unread count.';
          this.countError.set(errorMsg);
          this.countLoading.set(false);
          return throwError(() => err);
        })
      );
  }

  /**
   * 3. Mark a single notification as read.
   * PATCH /api/v1/notifications/:notificationId/read
   */
  markAsRead(
    notificationId: string
  ): Observable<StudentNotificationActionResponse> {
    const url = `${this.baseUrl}${STUDENT_NOTIFICATIONS_API.MARK_READ(notificationId)}`;

    // Optimistic update
    const current = this.notifications();
    const target = current.find((n) => n._id === notificationId);
    if (target && !target.is_read) {
      this.notifications.set(
        current.map((n) =>
          n._id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      this.unreadCount.update((count) => Math.max(0, count - 1));
    }

    return this.http
      .patch<StudentNotificationActionResponse>(url, {})
      .pipe(
        tap((res) => {
          if (res?.data) {
            this.notifications.set(
              this.notifications().map((n) =>
                n._id === notificationId ? { ...n, ...res.data } : n
              )
            );
          }
        }),
        catchError((err: HttpErrorResponse) => {
          // Revert optimistic update on failure if needed
          return throwError(() => err);
        })
      );
  }

  /**
   * 4. Mark all notifications as read.
   * PATCH /api/v1/notifications/read-all
   */
  markAllAsRead(): Observable<StudentNotificationReadAllResponse> {
    const url = `${this.baseUrl}${STUDENT_NOTIFICATIONS_API.MARK_ALL_READ}`;

    // Optimistic update
    this.notifications.set(
      this.notifications().map((n) => ({
        ...n,
        is_read: true,
        read_at: n.read_at || new Date().toISOString(),
      }))
    );
    this.unreadCount.set(0);

    return this.http
      .patch<StudentNotificationReadAllResponse>(url, {})
      .pipe(
        tap((res) => {
          this.unreadCount.set(0);
        }),
        catchError((err: HttpErrorResponse) => {
          return throwError(() => err);
        })
      );
  }

  /**
   * 5. Dismiss / Delete a single notification.
   * DELETE /api/v1/notifications/:notificationId
   */
  deleteNotification(
    notificationId: string
  ): Observable<StudentNotificationDismissResponse> {
    const url = `${this.baseUrl}${STUDENT_NOTIFICATIONS_API.DELETE(notificationId)}`;

    const target = this.notifications().find((n) => n._id === notificationId);
    if (target && !target.is_read) {
      this.unreadCount.update((count) => Math.max(0, count - 1));
    }
    this.notifications.set(
      this.notifications().filter((n) => n._id !== notificationId)
    );
    this.total.update((t) => Math.max(0, t - 1));

    return this.http
      .delete<StudentNotificationDismissResponse>(url)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          return throwError(() => err);
        })
      );
  }

  /**
   * 6. Create an in-app notification.
   * POST /api/v1/notifications
   */
  createNotification(
    payload: CreateStudentNotificationPayload
  ): Observable<StudentNotificationActionResponse> {
    const url = `${this.baseUrl}${STUDENT_NOTIFICATIONS_API.CREATE}`;

    return this.http
      .post<StudentNotificationActionResponse>(url, payload)
      .pipe(
        tap((res) => {
          if (res?.data) {
            this.notifications.update((list) => [res.data!, ...list]);
            this.unreadCount.update((c) => c + 1);
            this.total.update((t) => t + 1);
          }
        }),
        catchError((err: HttpErrorResponse) => {
          return throwError(() => err);
        })
      );
  }
}
