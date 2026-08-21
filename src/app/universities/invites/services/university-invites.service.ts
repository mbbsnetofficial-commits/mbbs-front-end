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
import { UNIVERSITY_INVITES_API } from '../constants/university-invites.constants';
import {
  CancelInvitationResponse,
  CreateInvitePayload,
  CreateInviteResponse,
  OrganizationInviteDetailResponse,
  OrganizationInviteItem,
  OrganizationInvitesFilters,
  OrganizationInvitesPagination,
  OrganizationInvitesResponse,
} from '../models/university-invites.model';

@Injectable({ providedIn: 'root' })
export class UniversityInvitesService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(UniversityAuthService);
  private readonly baseUrl = environment.universityApiBaseUrl;

  readonly invitations = signal<OrganizationInviteItem[]>([]);
  readonly pagination = signal<OrganizationInvitesPagination | null>(null);
  readonly loading = signal<boolean>(false);
  readonly sending = signal<boolean>(false);
  readonly cancelling = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly currentFilters = signal<OrganizationInvitesFilters>({
    page: 1,
    limit: 20,
  });

  // API #8: POST /organization/invites (Send Invitation)
  sendInvitation(payload: CreateInvitePayload): Observable<CreateInviteResponse> {
    this.sending.set(true);
    this.error.set(null);

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    });

    const url = `${this.baseUrl}${UNIVERSITY_INVITES_API.CREATE}`;

    return this.http.post<CreateInviteResponse>(url, payload, { headers }).pipe(
      tap((res) => {
        if (res?.success && res.data) {
          // Prepend to current list if loaded
          const currentList = this.invitations();
          const newItem: OrganizationInviteItem = {
            _id: res.data._id,
            studentId: res.data.studentId,
            organizationId: res.data.organizationId,
            subject: res.data.subject,
            message: res.data.message,
            course: res.data.course,
            tuitionFeeUsd: res.data.tuitionFeeUsd,
            status: res.data.status,
            createdAt: res.data.createdAt,
          };
          this.invitations.set([newItem, ...currentList]);
        }
        this.sending.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        const errorMsg = this.extractErrorMessage(err, 'create');
        this.error.set(errorMsg);
        this.sending.set(false);
        return throwError(() => err);
      })
    );
  }

  // API #9: GET /organization/invites (List Invitations)
  getInvitations(
    filters: OrganizationInvitesFilters = {}
  ): Observable<OrganizationInvitesResponse> {
    this.loading.set(true);
    this.error.set(null);

    const mergedFilters: OrganizationInvitesFilters = {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      ...filters,
    };
    this.currentFilters.set(mergedFilters);

    let params = new HttpParams();

    if (mergedFilters.page !== undefined && mergedFilters.page !== null) {
      params = params.set('page', mergedFilters.page.toString());
    }

    if (mergedFilters.limit !== undefined && mergedFilters.limit !== null) {
      params = params.set('limit', mergedFilters.limit.toString());
    }

    if (mergedFilters.status && mergedFilters.status.trim()) {
      params = params.set('status', mergedFilters.status.trim());
    }

    if (mergedFilters.search && mergedFilters.search.trim()) {
      params = params.set('search', mergedFilters.search.trim());
    }

    if (mergedFilters.sortBy && mergedFilters.sortBy.trim()) {
      params = params.set('sortBy', mergedFilters.sortBy.trim());
    }

    if (mergedFilters.sortOrder) {
      params = params.set('sortOrder', mergedFilters.sortOrder);
    }

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });

    const url = `${this.baseUrl}${UNIVERSITY_INVITES_API.LIST}`;

    return this.http
      .get<OrganizationInvitesResponse>(url, { headers, params })
      .pipe(
        tap((res) => {
          if (res?.success && res.data) {
            this.invitations.set(res.data.items || []);
            this.pagination.set(res.data.pagination || null);
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

  // API #6: GET /organization/invites/:inviteId (Get Single Invitation)
  getInvitation(
    inviteId: string
  ): Observable<OrganizationInviteDetailResponse> {
    this.loading.set(true);
    this.error.set(null);

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });

    const url = `${this.baseUrl}${UNIVERSITY_INVITES_API.DETAIL(inviteId)}`;

    return this.http
      .get<OrganizationInviteDetailResponse>(url, { headers })
      .pipe(
        tap(() => {
          this.loading.set(false);
        }),
        catchError((err: HttpErrorResponse) => {
          const errorMsg = this.extractErrorMessage(err, 'get');
          this.error.set(errorMsg);
          this.loading.set(false);
          return throwError(() => err);
        })
      );
  }

  // API #7: POST /organization/invites/:inviteId/cancel (Cancel Invitation)
  cancelInvitation(inviteId: string): Observable<CancelInvitationResponse> {
    this.cancelling.set(true);
    this.error.set(null);

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });

    const url = `${this.baseUrl}${UNIVERSITY_INVITES_API.CANCEL(inviteId)}`;

    return this.http.post<CancelInvitationResponse>(url, {}, { headers }).pipe(
      tap((res) => {
        if (res?.success) {
          // Update status in current list if loaded
          const updated = this.invitations().map((inv) =>
            inv._id === inviteId ? { ...inv, status: 'CANCELLED' } : inv
          );
          this.invitations.set(updated);
        }
        this.cancelling.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        const errorMsg = this.extractErrorMessage(err, 'cancel');
        this.error.set(errorMsg);
        this.cancelling.set(false);
        return throwError(() => err);
      })
    );
  }

  private extractErrorMessage(
    err: HttpErrorResponse,
    context: 'create' | 'list' | 'get' | 'cancel' = 'create'
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
        return context === 'create'
          ? 'Bad request. Please verify student ID and offer details.'
          : 'Bad request. Invalid query parameters provided.';
      case 401:
        return 'Session expired or unauthorized. Please sign in again.';
      case 403:
        return 'Access denied. You do not have permission to perform this action.';
      case 404:
        return context === 'cancel'
          ? 'Invitation not found or already removed.'
          : 'The requested invitation resource was not found.';
      case 409:
        return context === 'create'
          ? 'Conflict: An active admission offer already exists for this candidate student.'
          : 'Conflict: This invitation has already been processed or cancelled.';
      case 500:
        return 'Internal server error while processing invitation request. Please try again.';
      default:
        return (
          err.message ||
          'An unexpected error occurred while communicating with invitations backend.'
        );
    }
  }
}
