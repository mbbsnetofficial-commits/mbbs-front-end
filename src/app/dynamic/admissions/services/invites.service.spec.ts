import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import {
  InvitesService,
  BackendInviteSummaryResponse,
  BackendInviteListResponse,
  BackendInviteDetailsResponse,
  BackendInviteViewResponse,
} from './invites.service';
import { environment } from '../../../../environments/environment';

describe('InvitesService', () => {
  let service: InvitesService;
  let httpTesting: HttpTestingController;

  const mockSummaryResponse: BackendInviteSummaryResponse = {
    success: true,
    data: {
      total: 10,
      pending: 4,
      viewed: 2,
      accepted: 2,
      declined: 1,
      expired: 1,
      cancelled: 0,
    },
  };

  const mockListResponse: BackendInviteListResponse = {
    success: true,
    data: {
      items: [
        {
          _id: 'inv-kazan-real-101',
          studentId: 'student-99',
          organizationId: 'org-kazan-01',
          organizationName: 'Kazan State Medical University',
          organizationInfo: {
            name: 'Kazan State Medical University',
            country: 'Russia',
            city: 'Kazan',
            logo: 'https://example.com/kazan-logo.png',
            website: 'https://kazangmu.ru',
          },
          title: 'General Medicine (MBBS / MD)',
          description: 'Direct admission offer with pre-approved academic grant.',
          status: 'PENDING',
          viewedAt: null,
          respondedAt: null,
          expiresAt: '2026-09-15T23:59:59.000Z',
          createdAt: '2026-08-15T09:00:00.000Z',
          updatedAt: '2026-08-15T09:00:00.000Z',
        },
        {
          _id: 'inv-tma-real-102',
          studentId: 'student-99',
          organizationId: 'org-tma-02',
          organizationName: 'Tashkent Medical Academy',
          organizationInfo: {
            name: 'Tashkent Medical Academy',
            country: 'Uzbekistan',
            city: 'Tashkent',
            logo: 'https://example.com/tma-logo.png',
            website: 'https://tma.uz',
          },
          title: 'General Medicine English Medium',
          description: 'Top government academy invitation.',
          status: 'VIEWED',
          viewedAt: '2026-08-16T14:20:00.000Z',
          respondedAt: null,
          expiresAt: '2026-09-30T23:59:59.000Z',
          createdAt: '2026-08-12T11:30:00.000Z',
          updatedAt: '2026-08-16T14:20:00.000Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      },
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        InvitesService,
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
    service = TestBed.inject(InvitesService);

    // Initial summary request
    const summaryReq = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/invites/summary`);
    expect(summaryReq.request.method).toBe('GET');
    summaryReq.flush(mockSummaryResponse);

    // Initial list request
    const listReq = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites?page=1&limit=20`
    );
    expect(listReq.request.method).toBe('GET');
    listReq.flush(mockListResponse);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should fetch and map invite summary from GET /api/v1/student/invites/summary', () => {
    expect(service).toBeTruthy();
    const sum = service.summary();
    expect(sum.total).toBe(10);
    expect(sum.pending).toBe(4);
    expect(sum.viewed).toBe(2);
    expect(sum.accepted).toBe(2);
    expect(sum.declined).toBe(1);
    expect(sum.expired).toBe(1);
    expect(sum.cancelled).toBe(0);
  });

  it('should fetch and map invite list from GET /api/v1/student/invites', () => {
    const list = service.invites();
    expect(list.length).toBe(2);

    const first = list[0];
    expect(first.id).toBe('inv-kazan-real-101');
    expect(first.university.name).toBe('Kazan State Medical University');
    expect(first.university.country).toBe('Russia');
    expect(first.university.city).toBe('Kazan');
    expect(first.university.logoUrl).toBe('https://example.com/kazan-logo.png');
    expect(first.title).toBe('General Medicine (MBBS / MD)');
    expect(first.description).toBe('Direct admission offer with pre-approved academic grant.');
    expect(first.status).toBe('PENDING');
    expect(first.expiresAt).toBe('2026-09-15T23:59:59.000Z');

    const second = list[1];
    expect(second.id).toBe('inv-tma-real-102');
    expect(second.university.name).toBe('Tashkent Medical Academy');
    expect(second.status).toBe('VIEWED');
    expect(second.viewedAt).toBe('2026-08-16T14:20:00.000Z');
  });

  it('should handle pagination info from backend response', () => {
    const pag = service.pagination();
    expect(pag.page).toBe(1);
    expect(pag.limit).toBe(20);
    expect(pag.total).toBe(2);
    expect(pag.totalPages).toBe(1);
  });

  it('should fetch single invite details via GET /api/v1/student/invites/:inviteId', async () => {
    const detailResponse: BackendInviteDetailsResponse = {
      success: true,
      data: mockListResponse.data.items[0],
    };

    const promise = firstValueFrom(service.getInviteById('inv-kazan-real-101'));
    const req = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/inv-kazan-real-101`
    );
    expect(req.request.method).toBe('GET');
    req.flush(detailResponse);

    const res = await promise;
    expect(res).toBeDefined();
    expect(res?.id).toBe('inv-kazan-real-101');
    expect(res?.university.name).toBe('Kazan State Medical University');
    expect(res?.status).toBe('PENDING');
  });

  it('should handle 404 error when fetching non-existent invite details', async () => {
    const promise = firstValueFrom(service.getInviteById('non-existent-id'));
    const req = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/non-existent-id`
    );
    req.flush(
      { success: false, message: 'Invitation not found' },
      { status: 404, statusText: 'Not Found' }
    );

    try {
      await promise;
    } catch (err: any) {
      expect(err.status).toBe(404);
    }
  });

  it('should call POST /api/v1/student/invites/:inviteId/view and update status to VIEWED on success', async () => {
    const viewResponse: BackendInviteViewResponse = {
      success: true,
      data: {
        ...mockListResponse.data.items[0],
        status: 'VIEWED',
        viewedAt: '2026-08-19T09:30:00.000Z',
      },
    };

    const promise = firstValueFrom(service.markInviteAsViewed('inv-kazan-real-101'));
    const req = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/inv-kazan-real-101/view`
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(viewResponse);

    // Summary refresh request triggered
    const summaryRefresh = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/invites/summary`);
    summaryRefresh.flush({
      success: true,
      data: { ...mockSummaryResponse.data, pending: 3, viewed: 3 },
    });

    const res = await promise;
    expect(res?.status).toBe('VIEWED');
    expect(res?.viewedAt).toBe('2026-08-19T09:30:00.000Z');

    const updatedInList = service.invites().find((i) => i.id === 'inv-kazan-real-101');
    expect(updatedInList?.status).toBe('VIEWED');
  });

  it('should handle failure in POST /api/v1/student/invites/:inviteId/view without falsely updating status', async () => {
    const promise = firstValueFrom(service.markInviteAsViewed('inv-kazan-real-101'));
    const req = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/inv-kazan-real-101/view`
    );
    req.flush(
      { success: false, message: 'Server Error' },
      { status: 500, statusText: 'Internal Server Error' }
    );

    try {
      await promise;
    } catch (err: any) {
      expect(err.status).toBe(500);
    }

    const unChanged = service.invites().find((i) => i.id === 'inv-kazan-real-101');
    expect(unChanged?.status).toBe('PENDING'); // Not falsely marked as VIEWED
  });

  it('should handle empty response from GET /api/v1/student/invites', async () => {
    const emptyResponse: BackendInviteListResponse = {
      success: true,
      data: {
        items: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      },
    };

    const promise = firstValueFrom(service.loadInvites(1, 20));
    const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/invites?page=1&limit=20`);
    req.flush(emptyResponse);

    const res = await promise;
    expect(res.length).toBe(0);
    expect(service.invites().length).toBe(0);
  });

  it('should handle API failure without falling back to mock invitation cards', async () => {
    const promise = firstValueFrom(service.loadInvites(1, 20));
    const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/invites?page=1&limit=20`);
    req.flush({ message: 'Server Unavailable' }, { status: 500, statusText: 'Server Error' });

    try {
      await promise;
    } catch {
      // Expected
    }

    expect(service.error()).toBeTruthy();
    expect(service.loading()).toBe(false);
    expect(service.invites().length).toBe(0); // Never fallback to fake mock cards
  });

  it('should filter by status using query param when specified', async () => {
    const filteredResponse: BackendInviteListResponse = {
      success: true,
      data: {
        items: [mockListResponse.data.items[0]],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      },
    };

    const promise = firstValueFrom(service.loadInvites(1, 20, 'PENDING'));
    const req = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites?page=1&limit=20&status=PENDING`
    );
    expect(req.request.params.get('status')).toBe('PENDING');
    req.flush(filteredResponse);

    const res = await promise;
    expect(res.length).toBe(1);
    expect(res[0].status).toBe('PENDING');
  });
});
