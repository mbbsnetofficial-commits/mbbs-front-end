import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ADMISSIONS_API } from '../constants/admissions-api.constants';
import { DeclineReason, Invite, InviteHistoryItem, InviteStatus, InviteSummaryCounts, PaginationInfo } from '../models/invite.model';

export interface BackendInviteSummaryResponse {
  success: boolean;
  message?: string;
  data: {
    total: number;
    pending: number;
    viewed: number;
    accepted: number;
    declined: number;
    expired: number;
    cancelled: number;
  };
}

export interface BackendOrganizationInfo {
  name?: string;
  country?: string;
  city?: string;
  logo?: string;
  website?: string;
}

export interface BackendInviteItem {
  _id: string;
  studentId?: string;
  organizationId?: string;
  organizationName?: string;
  organizationInfo?: BackendOrganizationInfo;
  title?: string;
  description?: string;
  status: InviteStatus;
  viewedAt?: string | null;
  respondedAt?: string | null;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendInviteListResponse {
  success: boolean;
  message?: string;
  data: {
    items: BackendInviteItem[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface BackendInviteDetailsResponse {
  success: boolean;
  message?: string;
  data: BackendInviteItem;
}

export interface BackendInviteViewResponse {
  success: boolean;
  message?: string;
  data?: BackendInviteItem;
}

export interface BackendInviteAcceptResponse {
  success: boolean;
  message?: string;
  data?: BackendInviteItem;
}

export interface BackendInviteDeclineResponse {
  success: boolean;
  message?: string;
  data?: BackendInviteItem;
}

export interface BackendInviteHistoryItem {
  _id?: string;
  id?: string;
  inviteId?: string;
  action?: string;
  event?: string;
  status?: string;
  title?: string;
  description?: string;
  actor?: string;
  actorType?: string;
  createdAt?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface BackendInviteHistoryResponse {
  success: boolean;
  message?: string;
  data?: BackendInviteHistoryItem[] | { items: BackendInviteHistoryItem[] };
}

@Injectable({ providedIn: 'root' })
export class InvitesService {
  private readonly http = inject(HttpClient);
  private readonly invitesUrl = `${environment.admissionsApiBaseUrl}${ADMISSIONS_API.INVITES}`;
  private readonly summaryUrl = `${environment.admissionsApiBaseUrl}${ADMISSIONS_API.INVITE_SUMMARY}`;

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly pagination = signal<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  private readonly invitesState = signal<Invite[]>([]);
  readonly invites = this.invitesState.asReadonly();

  readonly summaryLoading = signal<boolean>(false);
  readonly summaryError = signal<string | null>(null);

  private readonly summaryState = signal<InviteSummaryCounts>({
    total: 0,
    pending: 0,
    viewed: 0,
    accepted: 0,
    declined: 0,
    expired: 0,
    cancelled: 0,
    newCount: 0,
    viewedCount: 0,
    acceptedCount: 0,
    declinedCount: 0,
    expiredCount: 0,
  });

  readonly summary = this.summaryState.asReadonly();

  constructor() {
    this.loadSummary().subscribe({ error: () => {} });
    this.loadInvites().subscribe({ error: () => {} });
  }

  loadSummary(): Observable<InviteSummaryCounts> {
    this.summaryLoading.set(true);
    this.summaryError.set(null);

    return this.http.get<BackendInviteSummaryResponse>(this.summaryUrl).pipe(
      map((res) => {
        const d = res?.data;
        const counts: InviteSummaryCounts = {
          total: Number(d?.total ?? 0),
          pending: Number(d?.pending ?? 0),
          viewed: Number(d?.viewed ?? 0),
          accepted: Number(d?.accepted ?? 0),
          declined: Number(d?.declined ?? 0),
          expired: Number(d?.expired ?? 0),
          cancelled: Number(d?.cancelled ?? 0),
          newCount: Number(d?.pending ?? 0),
          viewedCount: Number(d?.viewed ?? 0),
          acceptedCount: Number(d?.accepted ?? 0),
          declinedCount: Number(d?.declined ?? 0),
          expiredCount: Number(d?.expired ?? 0),
        };
        this.summaryState.set(counts);
        this.summaryLoading.set(false);
        return counts;
      }),
      catchError((err: HttpErrorResponse) => {
        const message =
          err.error?.message || err.message || 'Failed to load invite summary';
        this.summaryError.set(message);
        this.summaryLoading.set(false);
        return throwError(() => err);
      })
    );
  }

  loadInvites(page: number = 1, limit: number = 20, status?: string): Observable<Invite[]> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status && status !== 'ALL') {
      params = params.set('status', status);
    }

    return this.http.get<BackendInviteListResponse>(this.invitesUrl, { params }).pipe(
      map((res) => {
        const items = res?.data?.items || [];
        const mapped = items.map((item) => this.mapBackendInviteToInvite(item));
        this.invitesState.set(mapped);
        if (res?.data?.pagination) {
          this.pagination.set(res.data.pagination);
        }
        this.loading.set(false);
        return mapped;
      }),
      catchError((err: HttpErrorResponse) => {
        const message =
          err.error?.message || err.message || 'Failed to load invitations';
        this.error.set(message);
        this.loading.set(false);
        this.invitesState.set([]);
        return throwError(() => err);
      })
    );
  }

  getInvites(filterStatus: string = 'ALL'): Observable<Invite[]> {
    const statusParam = filterStatus !== 'ALL' ? filterStatus : undefined;
    return this.loadInvites(1, 20, statusParam);
  }

  getInviteSummary(): Observable<InviteSummaryCounts> {
    return this.loadSummary();
  }

  getInviteById(inviteId: string): Observable<Invite | undefined> {
    if (!inviteId) {
      return of(undefined);
    }
    return this.http.get<BackendInviteDetailsResponse>(`${this.invitesUrl}/${inviteId}`).pipe(
      map((res) => {
        const item = res?.data;
        if (!item) return undefined;
        return this.mapBackendInviteToInvite(item);
      }),
      catchError((err: HttpErrorResponse) => {
        return throwError(() => err);
      })
    );
  }

  getInviteDetails(inviteId: string): Observable<Invite | undefined> {
    return this.getInviteById(inviteId);
  }

  markInviteAsViewed(inviteId: string): Observable<Invite | undefined> {
    if (!inviteId) {
      return of(undefined);
    }
    return this.http.post<BackendInviteViewResponse>(`${this.invitesUrl}/${inviteId}/view`, {}).pipe(
      map((res) => {
        this.invitesState.update((prev) =>
          prev.map((item) => {
            if (item.id === inviteId) {
              return {
                ...item,
                status: 'VIEWED',
                viewedAt: res?.data?.viewedAt || new Date().toISOString(),
              };
            }
            return item;
          })
        );
        this.loadSummary().subscribe({ error: () => {} });

        if (res?.data) {
          return this.mapBackendInviteToInvite(res.data);
        }
        return this.invitesState().find((i) => i.id === inviteId);
      }),
      catchError((err: HttpErrorResponse) => {
        return throwError(() => err);
      })
    );
  }

  markAsViewed(inviteId: string): Observable<Invite | undefined> {
    return this.markInviteAsViewed(inviteId);
  }

  acceptInvite(inviteId: string): Observable<Invite | undefined> {
    if (!inviteId) {
      return of(undefined);
    }
    return this.http
      .post<BackendInviteAcceptResponse>(`${this.invitesUrl}/${inviteId}/accept`, {})
      .pipe(
        map((res) => {
          this.invitesState.update((prev) =>
            prev.map((item) => {
              if (item.id === inviteId) {
                return {
                  ...item,
                  status: 'ACCEPTED',
                  respondedAt: res?.data?.respondedAt || new Date().toISOString(),
                };
              }
              return item;
            })
          );
          this.loadSummary().subscribe({ error: () => {} });

          if (res?.data) {
            return this.mapBackendInviteToInvite(res.data);
          }
          return this.invitesState().find((i) => i.id === inviteId);
        }),
        catchError((err: HttpErrorResponse) => {
          return throwError(() => err);
        })
      );
  }

  declineInvite(
    inviteId: string,
    payload?: { reason?: DeclineReason; note?: string }
  ): Observable<Invite | undefined> {
    if (!inviteId) {
      return of(undefined);
    }
    const body = payload?.reason
      ? { reason: payload.reason, ...(payload.note ? { note: payload.note } : {}) }
      : {};

    return this.http
      .post<BackendInviteDeclineResponse>(`${this.invitesUrl}/${inviteId}/decline`, body)
      .pipe(
        map((res) => {
          this.invitesState.update((prev) =>
            prev.map((item) => {
              if (item.id === inviteId) {
                return {
                  ...item,
                  status: 'DECLINED',
                  declineReason: payload?.reason,
                  declineNote: payload?.note,
                  respondedAt: res?.data?.respondedAt || new Date().toISOString(),
                };
              }
              return item;
            })
          );
          this.loadSummary().subscribe({ error: () => {} });

          if (res?.data) {
            return this.mapBackendInviteToInvite(res.data);
          }
          return this.invitesState().find((i) => i.id === inviteId);
        }),
        catchError((err: HttpErrorResponse) => {
          return throwError(() => err);
        })
      );
  }

  getInviteHistory(inviteId: string): Observable<InviteHistoryItem[]> {
    if (!inviteId) {
      return of([]);
    }
    return this.http
      .get<BackendInviteHistoryResponse>(`${this.invitesUrl}/${inviteId}/history`)
      .pipe(
        map((res) => {
          if (!res || !res.data) {
            return [];
          }
          const rawItems: BackendInviteHistoryItem[] = Array.isArray(res.data)
            ? res.data
            : Array.isArray((res.data as any).items)
            ? (res.data as any).items
            : [];

          return rawItems.map((item) => ({
            id: item.id || item._id || '',
            action: item.action || item.event || item.status || 'UPDATE',
            title: item.title || this.formatActionTitle(item.action || item.event || item.status || ''),
            description: item.description || '',
            actor: item.actor || item.actorType || 'SYSTEM',
            createdAt: item.createdAt || item.timestamp || new Date().toISOString(),
            metadata: item.metadata,
          }));
        }),
        catchError((err: HttpErrorResponse) => {
          return throwError(() => err);
        })
      );
  }

  private formatActionTitle(action: string): string {
    switch (action.toUpperCase()) {
      case 'CREATED':
      case 'INVITE_CREATED':
      case 'ISSUED':
        return 'Invitation Issued';
      case 'VIEWED':
      case 'INVITE_VIEWED':
        return 'Invitation Reviewed';
      case 'ACCEPTED':
      case 'INVITE_ACCEPTED':
        return 'Invitation Accepted';
      case 'DECLINED':
      case 'INVITE_DECLINED':
        return 'Invitation Declined';
      case 'EXPIRED':
      case 'INVITE_EXPIRED':
        return 'Invitation Expired';
      case 'CANCELLED':
      case 'WITHDRAWN':
        return 'Invitation Withdrawn';
      default:
        return action.replace(/_/g, ' ') || 'Activity Logged';
    }
  }

  private mapBackendInviteToInvite(item: BackendInviteItem): Invite {
    const orgName = item.organizationInfo?.name || item.organizationName || 'University';
    const orgCountry = item.organizationInfo?.country || '';
    const orgCity = item.organizationInfo?.city || '';
    const orgLogo = item.organizationInfo?.logo || '';
    const orgWebsite = item.organizationInfo?.website || '';

    return {
      id: item._id,
      inviteNumber: item._id.startsWith('INV-') ? item._id : `INV-${item._id.slice(-6).toUpperCase()}`,
      universityId: item.organizationId || item._id,
      university: {
        id: item.organizationId || item._id,
        name: orgName,
        code: orgName
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 5)
          .toUpperCase(),
        logoUrl: orgLogo,
        coverImageUrl: '',
        country: orgCountry,
        countryCode: orgCountry.slice(0, 2).toUpperCase(),
        city: orgCity,
        recognition: [],
        foundedYear: 0,
        campusType: '',
        overview: item.description || '',
        websiteUrl: orgWebsite,
        featuredHighlights: [],
      },
      program: {
        programName: item.title || 'General Medicine (MBBS / MD)',
        degree: 'Doctor of Medicine (MD / MBBS)',
        duration: 'Standard Curriculum',
        durationYears: 6,
        language: 'English Medium',
        intake: 'Upcoming Intake',
        applicationDeadline: item.expiresAt || '',
        clinicalRotations: '',
        eligibilityCriteria: [],
      },
      financial: {
        tuitionAnnual: 0,
        tuitionTotal: 0,
        currency: 'USD',
        scholarshipPercentage: 0,
        scholarshipAmount: 0,
        netTuitionAnnual: 0,
        applicationFee: 0,
        estimatedHostelAnnual: 0,
        estimatedLivingAnnual: 0,
      },
      eligibility: {
        studentNeetScore: 0,
        minNeetScore: 0,
        studentAcademicPcb: 0,
        minAcademicPcb: 0,
        matchPercentage: 0,
        matchedFactors: [],
        reasonsForInvite: [],
      },
      title: item.title,
      description: item.description,
      invitationMessage:
        item.description ||
        item.title ||
        'Direct university admission opportunity extended to candidate.',
      status: item.status,
      issuedAt: item.createdAt || new Date().toISOString(),
      createdAt: item.createdAt,
      viewedAt: item.viewedAt,
      respondedAt: item.respondedAt,
      expiresAt: item.expiresAt || '',
      tags: [orgCountry, item.title].filter(Boolean) as string[],
    };
  }
}
