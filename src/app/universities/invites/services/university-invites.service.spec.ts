import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { UniversityAuthService } from '../../auth/services/university-auth.service';
import {
  CancelInvitationResponse,
  CreateInvitePayload,
  CreateInviteResponse,
  OrganizationInvitesFilters,
  OrganizationInvitesResponse,
} from '../models/university-invites.model';
import { UniversityInvitesService } from './university-invites.service';

describe('UniversityInvitesService', () => {
  let service: UniversityInvitesService;
  let httpTestingController: HttpTestingController;
  let authServiceMock: { getToken: ReturnType<typeof vi.fn> };

  const baseUrl = environment.universityApiBaseUrl;
  const invitesUrl = `${baseUrl}/organization/invites`;
  const inviteId = '67b36f1c4e9b8a0012345678';
  const expectedCancelUrl = `${invitesUrl}/${inviteId}/cancel`;

  const mockCancelResponse: CancelInvitationResponse = {
    success: true,
    message: 'Invitation cancelled successfully',
    data: {
      _id: inviteId,
      status: 'CANCELLED',
      cancelledAt: '2026-08-19T01:15:00.000Z',
    },
  };

  const mockCreatePayload: CreateInvitePayload = {
    studentId: 'STU17869056359535Q01Q3',
    subject: 'Direct MBBS Admission Offer - Tbilisi State Medical University',
    message: 'We are pleased to offer you admission to our MBBS program.',
    course: 'MBBS',
    tuitionFeeUsd: 25000,
    intake: 'September 2026',
  };

  const mockCreateResponse: CreateInviteResponse = {
    success: true,
    message: 'Invitation sent successfully',
    data: {
      _id: '67b36f1c4e9b8a0012345999',
      studentId: 'STU17869056359535Q01Q3',
      organizationId: 'ORG_TSMU_001',
      subject: 'Direct MBBS Admission Offer - Tbilisi State Medical University',
      message: 'We are pleased to offer you admission to our MBBS program.',
      course: 'MBBS',
      tuitionFeeUsd: 25000,
      status: 'PENDING',
      createdAt: '2026-08-21T08:00:00.000Z',
    },
  };

  const mockListResponse: OrganizationInvitesResponse = {
    success: true,
    message: 'Invitations retrieved successfully',
    data: {
      items: [
        {
          _id: '67b36f1c4e9b8a0012345678',
          studentId: 'STU17869056359535Q01Q3',
          organizationId: 'ORG_TSMU_001',
          subject: 'Direct MBBS Admission Offer',
          status: 'PENDING',
          course: 'MBBS',
          tuitionFeeUsd: 25000,
          createdAt: '2026-08-19T01:00:00.000Z',
          student: {
            fullName: 'Ananya Sharma',
            city: 'Delhi',
            country: 'India',
            neetScore: 610,
            pcbPercentage: 94,
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
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
        UniversityInvitesService,
        { provide: UniversityAuthService, useValue: authServiceMock },
      ],
    });

    service = TestBed.inject(UniversityInvitesService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create UniversityInvitesService with initial state', () => {
    expect(service).toBeTruthy();
    expect(service.loading()).toBe(false);
    expect(service.sending()).toBe(false);
    expect(service.cancelling()).toBe(false);
    expect(service.error()).toBeNull();
    expect(service.invitations()).toEqual([]);
  });

  describe('API #8: sendInvitation(payload)', () => {
    it('should call POST /organization/invites with exact payload and Bearer token', () => {
      service.sendInvitation(mockCreatePayload).subscribe();

      const req = httpTestingController.expectOne(invitesUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockCreatePayload);
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-university-token'
      );
      expect(req.request.headers.get('Content-Type')).toBe('application/json');

      req.flush(mockCreateResponse);
    });

    it('should map created invite, prepend to invitations signal, and reset sending signal upon success', () => {
      service.sendInvitation(mockCreatePayload).subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res.data.status).toBe('PENDING');
        expect(res.data.studentId).toBe('STU17869056359535Q01Q3');
      });

      const req = httpTestingController.expectOne(invitesUrl);
      req.flush(mockCreateResponse);

      expect(service.sending()).toBe(false);
      expect(service.error()).toBeNull();
      expect(service.invitations().length).toBe(1);
      expect(service.invitations()[0]._id).toBe('67b36f1c4e9b8a0012345999');
    });

    it('should handle 400 Bad Request error on sendInvitation', () => {
      service.sendInvitation(mockCreatePayload).subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(invitesUrl);
      req.flush(null, { status: 400, statusText: 'Bad Request' });

      expect(service.error()).toBe(
        'Bad request. Please verify student ID and offer details.'
      );
      expect(service.sending()).toBe(false);
    });

    it('should handle 409 Conflict error when offer already exists for student', () => {
      service.sendInvitation(mockCreatePayload).subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(invitesUrl);
      req.flush(
        { message: 'Candidate student already has an active invitation.' },
        { status: 409, statusText: 'Conflict' }
      );

      expect(service.error()).toBe(
        'Candidate student already has an active invitation.'
      );
      expect(service.sending()).toBe(false);
    });

    it('should handle 500 Server Error on sendInvitation', () => {
      service.sendInvitation(mockCreatePayload).subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(invitesUrl);
      req.flush({ error: 'DB error' }, { status: 500, statusText: 'Internal Server Error' });

      expect(service.error()).toBe('DB error');
      expect(service.sending()).toBe(false);
    });

    it('should toggle sending signal lifecycle', () => {
      expect(service.sending()).toBe(false);

      service.sendInvitation(mockCreatePayload).subscribe();
      expect(service.sending()).toBe(true);

      const req = httpTestingController.expectOne(invitesUrl);
      req.flush(mockCreateResponse);

      expect(service.sending()).toBe(false);
    });
  });

  describe('API #9: getInvitations(filters)', () => {
    it('should call GET /organization/invites with default query params and Bearer token', () => {
      service.getInvitations().subscribe();

      const req = httpTestingController.expectOne(
        (r) =>
          r.url === invitesUrl &&
          r.params.get('page') === '1' &&
          r.params.get('limit') === '20'
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-university-token'
      );

      req.flush(mockListResponse);
    });

    it('should append custom query params (status, search, sortBy, sortOrder)', () => {
      const filters: OrganizationInvitesFilters = {
        page: 2,
        limit: 10,
        status: 'PENDING',
        search: 'STU1786',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      service.getInvitations(filters).subscribe();

      const req = httpTestingController.expectOne(
        (r) =>
          r.url === invitesUrl &&
          r.params.get('page') === '2' &&
          r.params.get('limit') === '10' &&
          r.params.get('status') === 'PENDING' &&
          r.params.get('search') === 'STU1786' &&
          r.params.get('sortBy') === 'createdAt' &&
          r.params.get('sortOrder') === 'desc'
      );
      expect(req.request.method).toBe('GET');

      req.flush(mockListResponse);
    });

    it('should map invitations response and update signals upon success', () => {
      service.getInvitations().subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res.data.items.length).toBe(1);
      });

      const req = httpTestingController.expectOne((r) => r.url === invitesUrl);
      req.flush(mockListResponse);

      expect(service.invitations().length).toBe(1);
      expect(service.pagination()?.totalPages).toBe(1);
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('should handle 401 Unauthorized on getInvitations', () => {
      service.getInvitations().subscribe({ error: () => {} });

      const req = httpTestingController.expectOne((r) => r.url === invitesUrl);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(service.error()).toBe('Unauthorized');
      expect(service.loading()).toBe(false);
    });

    it('should handle 500 Server Error on getInvitations', () => {
      service.getInvitations().subscribe({ error: () => {} });

      const req = httpTestingController.expectOne((r) => r.url === invitesUrl);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(service.error()).toBe(
        'Internal server error while processing invitation request. Please try again.'
      );
      expect(service.loading()).toBe(false);
    });
  });

  describe('API #7: cancelInvitation(inviteId)', () => {
    it('should call POST /organization/invites/:inviteId/cancel with empty body and Bearer token', () => {
      service.cancelInvitation(inviteId).subscribe();

      const req = httpTestingController.expectOne(expectedCancelUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-university-token'
      );

      req.flush(mockCancelResponse);
    });

    it('should map cancellation response upon success and reset cancelling signal', () => {
      service.cancelInvitation(inviteId).subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res.data.status).toBe('CANCELLED');
        expect(res.data._id).toBe(inviteId);
      });

      const req = httpTestingController.expectOne(expectedCancelUrl);
      req.flush(mockCancelResponse);

      expect(service.cancelling()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('should handle 409 Conflict error when invite is already settled', () => {
      service.cancelInvitation(inviteId).subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(expectedCancelUrl);
      req.flush(
        { message: 'Conflict: Invitation is no longer pending.' },
        { status: 409, statusText: 'Conflict' }
      );

      expect(service.error()).toBe(
        'Conflict: Invitation is no longer pending.'
      );
      expect(service.cancelling()).toBe(false);
    });
  });

  describe('API #6: getInvitation(inviteId)', () => {
    it('should call GET /organization/invites/:inviteId with Bearer token', () => {
      const singleInviteUrl = `${invitesUrl}/${inviteId}`;

      service.getInvitation(inviteId).subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res.data._id).toBe(inviteId);
      });

      const req = httpTestingController.expectOne(singleInviteUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-university-token'
      );

      req.flush({
        success: true,
        data: mockListResponse.data.items[0],
      });

      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('should handle 404 Not Found error on getInvitation', () => {
      const singleInviteUrl = `${invitesUrl}/${inviteId}`;

      service.getInvitation(inviteId).subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(singleInviteUrl);
      req.flush({ message: 'Invitation not found' }, { status: 404, statusText: 'Not Found' });

      expect(service.error()).toBe('Invitation not found');
      expect(service.loading()).toBe(false);
    });
  });
});
