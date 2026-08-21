import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { UniversityAuthService } from '../../auth/services/university-auth.service';
import { DashboardSummaryResponse } from '../models/university-dashboard.model';
import { UniversityDashboardService } from './university-dashboard.service';

describe('UniversityDashboardService', () => {
  let service: UniversityDashboardService;
  let httpTestingController: HttpTestingController;
  let authServiceMock: { getToken: ReturnType<typeof vi.fn> };

  const expectedSummaryUrl = `${environment.universityApiBaseUrl}/organization/dashboard/summary`;

  const mockSummaryResponse: DashboardSummaryResponse = {
    success: true,
    data: {
      totalStudents: 150,
      studentsViewed: 12,
      invitesSent: 25,
      pendingInvites: 10,
      acceptedInvites: 8,
      declinedInvites: 4,
      recentInvites: [
        {
          _id: '67b36f1c4e9b8a0012345678',
          studentId: 'STU17869056359535Q01Q3',
          subject: 'Direct MBBS Admission Offer - Tbilisi State Medical University',
          status: 'PENDING',
          createdAt: '2026-08-19T01:00:00.000Z',
        },
      ],
      recentActivity: [
        {
          _id: '67b36f2a4e9b8a0012345690',
          type: 'INVITE_SENT',
          title: 'Invitation Sent',
          message: 'Invitation successfully sent to student (STU17869056359535Q01Q3).',
          read: false,
          createdAt: '2026-08-19T01:00:00.000Z',
        },
      ],
    },
  };

  beforeEach(() => {
    authServiceMock = {
      getToken: vi.fn().mockReturnValue('mock-university-token'),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UniversityDashboardService,
        { provide: UniversityAuthService, useValue: authServiceMock },
      ],
    });

    service = TestBed.inject(UniversityDashboardService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create UniversityDashboardService with initial null state', () => {
    expect(service).toBeTruthy();
    expect(service.summary()).toBeNull();
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('should call GET /organization/dashboard/summary with Authorization Bearer header', () => {
    service.loadSummary().subscribe();

    const req = httpTestingController.expectOne(expectedSummaryUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-university-token');

    req.flush(mockSummaryResponse);
  });

  it('should map all six KPI values and arrays correctly upon successful response', () => {
    service.loadSummary().subscribe((res) => {
      expect(res.success).toBe(true);
    });

    const req = httpTestingController.expectOne(expectedSummaryUrl);
    req.flush(mockSummaryResponse);

    const summary = service.summary();
    expect(summary).toBeTruthy();
    expect(summary?.totalStudents).toBe(150);
    expect(summary?.studentsViewed).toBe(12);
    expect(summary?.invitesSent).toBe(25);
    expect(summary?.pendingInvites).toBe(10);
    expect(summary?.acceptedInvites).toBe(8);
    expect(summary?.declinedInvites).toBe(4);
    expect(summary?.recentInvites.length).toBe(1);
    expect(summary?.recentInvites[0].studentId).toBe('STU17869056359535Q01Q3');
    expect(summary?.recentActivity.length).toBe(1);
    expect(summary?.recentActivity[0].title).toBe('Invitation Sent');
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('should handle empty recentInvites and recentActivity correctly without fabricating fallback data', () => {
    const emptyResponse: DashboardSummaryResponse = {
      success: true,
      data: {
        totalStudents: 0,
        studentsViewed: 0,
        invitesSent: 0,
        pendingInvites: 0,
        acceptedInvites: 0,
        declinedInvites: 0,
        recentInvites: [],
        recentActivity: [],
      },
    };

    service.loadSummary().subscribe();

    const req = httpTestingController.expectOne(expectedSummaryUrl);
    req.flush(emptyResponse);

    const summary = service.summary();
    expect(summary?.recentInvites).toEqual([]);
    expect(summary?.recentActivity).toEqual([]);
    expect(summary?.totalStudents).toBe(0);
  });

  it('should handle 401 Unauthorized and populate error state without fake fallback data', () => {
    service.loadSummary().subscribe({
      error: () => {},
    });

    const req = httpTestingController.expectOne(expectedSummaryUrl);
    req.flush({ message: 'Unauthorized organization access' }, { status: 401, statusText: 'Unauthorized' });

    expect(service.summary()).toBeNull();
    expect(service.loading()).toBe(false);
    expect(service.error()).toBe('Unauthorized organization access');
  });

  it('should handle 403 Forbidden and populate error state', () => {
    service.loadSummary().subscribe({
      error: () => {},
    });

    const req = httpTestingController.expectOne(expectedSummaryUrl);
    req.flush({ message: 'Forbidden organization access' }, { status: 403, statusText: 'Forbidden' });

    expect(service.error()).toBe('Forbidden organization access');
    expect(service.loading()).toBe(false);
  });

  it('should handle 404 Not Found gracefully', () => {
    service.loadSummary().subscribe({
      error: () => {},
    });

    const req = httpTestingController.expectOne(expectedSummaryUrl);
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(service.error()).toBe('Organization dashboard endpoint not found.');
    expect(service.loading()).toBe(false);
  });

  it('should handle 500 Internal Server Error gracefully', () => {
    service.loadSummary().subscribe({
      error: () => {},
    });

    const req = httpTestingController.expectOne(expectedSummaryUrl);
    req.flush({ error: 'Database connection failed' }, { status: 500, statusText: 'Internal Server Error' });

    expect(service.error()).toBe('Database connection failed');
    expect(service.loading()).toBe(false);
  });

  it('should toggle loading state from true to false across the request lifecycle', () => {
    expect(service.loading()).toBe(false);

    service.loadSummary().subscribe();
    expect(service.loading()).toBe(true);

    const req = httpTestingController.expectOne(expectedSummaryUrl);
    req.flush(mockSummaryResponse);

    expect(service.loading()).toBe(false);
  });

  it('should allow retry to trigger another GET request and clear previous error', () => {
    // 1st request fails
    service.loadSummary().subscribe({ error: () => {} });
    const req1 = httpTestingController.expectOne(expectedSummaryUrl);
    req1.flush({ message: 'Network error' }, { status: 500, statusText: 'Internal Server Error' });
    expect(service.error()).toBe('Network error');

    // 2nd request (retry) succeeds
    service.loadSummary().subscribe();
    expect(service.error()).toBeNull();
    const req2 = httpTestingController.expectOne(expectedSummaryUrl);
    req2.flush(mockSummaryResponse);

    expect(service.summary()?.totalStudents).toBe(150);
    expect(service.error()).toBeNull();
  });
});
