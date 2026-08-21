import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { UniversityAuthService } from '../../auth/services/university-auth.service';
import {
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
  UniversityNotification,
  UniversityNotificationListResponse,
  UniversityUnreadNotificationCountResponse,
} from '../models/university-notification.model';
import { UniversityNotificationsService } from './university-notifications.service';

describe('UniversityNotificationsService', () => {
  let service: UniversityNotificationsService;
  let httpTestingController: HttpTestingController;
  let authServiceMock: { getToken: ReturnType<typeof vi.fn> };

  const baseUrl = environment.universityApiBaseUrl;
  const listUrl = `${baseUrl}/organization/notifications`;
  const unreadCountUrl = `${baseUrl}/organization/notifications/unread-count`;
  const notificationId = '67b36f2a4e9b8a0012345690';
  const markReadUrl = `${baseUrl}/organization/notifications/${notificationId}/read`;
  const markAllReadUrl = `${baseUrl}/organization/notifications/read-all`;

  const mockNotification: UniversityNotification = {
    _id: notificationId,
    organizationId: 'ORG_TSMU_001',
    type: 'INVITE_SENT',
    title: 'Invitation Sent',
    message:
      'Invitation successfully sent to student (STU17869056359535Q01Q3).',
    read: false,
    createdAt: '2026-08-19T01:10:00.000Z',
    updatedAt: '2026-08-19T01:10:00.000Z',
  };

  const mockListResponse: UniversityNotificationListResponse = {
    success: true,
    message: 'Notifications retrieved successfully',
    data: {
      items: [mockNotification],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    },
  };

  const mockUnreadCountResponse: UniversityUnreadNotificationCountResponse = {
    success: true,
    message: 'Unread count retrieved',
    data: {
      count: 3,
    },
  };

  const mockMarkReadResponse: MarkNotificationReadResponse = {
    success: true,
    message: 'Notification marked as read',
    data: {
      _id: notificationId,
      read: true,
      readAt: '2026-08-19T01:25:00.000Z',
    },
  };

  const mockMarkAllReadResponse: MarkAllNotificationsReadResponse = {
    success: true,
    message: 'All notifications marked as read',
    data: {
      success: true,
      markedCount: 3,
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
        UniversityNotificationsService,
        { provide: UniversityAuthService, useValue: authServiceMock },
      ],
    });

    service = TestBed.inject(UniversityNotificationsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create UniversityNotificationsService with initial signals state', () => {
    expect(service).toBeTruthy();
    expect(service.loading()).toBe(false);
    expect(service.countLoading()).toBe(false);
    expect(service.markingReadId()).toBeNull();
    expect(service.markingAllRead()).toBe(false);
    expect(service.error()).toBeNull();
    expect(service.countError()).toBeNull();
    expect(service.notifications()).toEqual([]);
    expect(service.unreadCount()).toBe(0);
    expect(service.pagination()).toBeNull();
  });

  describe('API #13: getNotifications', () => {
    it('1. should call GET /organization/notifications with default page, limit and Bearer token', () => {
      service.getNotifications().subscribe();

      const req = httpTestingController.expectOne(
        (r) =>
          r.url === listUrl &&
          r.params.get('page') === '1' &&
          r.params.get('limit') === '20'
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-university-token'
      );

      req.flush(mockListResponse);
    });

    it('2. should send custom page, limit, and unreadOnly query parameters correctly', () => {
      service
        .getNotifications({ page: 2, limit: 10, unreadOnly: true })
        .subscribe();

      const req = httpTestingController.expectOne(
        (r) =>
          r.url === listUrl &&
          r.params.get('page') === '2' &&
          r.params.get('limit') === '10' &&
          r.params.get('unreadOnly') === 'true'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockListResponse);
    });

    it('3. should map paginated response items and pagination metadata to signals', () => {
      service.getNotifications().subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpTestingController.expectOne((r) => r.url === listUrl);
      req.flush(mockListResponse);

      expect(service.notifications().length).toBe(1);
      expect(service.notifications()[0].title).toBe('Invitation Sent');
      expect(service.pagination()?.total).toBe(1);
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('4. should handle 401 Unauthorized error on getNotifications', () => {
      service.getNotifications().subscribe({ error: () => {} });

      const req = httpTestingController.expectOne((r) => r.url === listUrl);
      req.flush({ message: 'Token missing.' }, {
        status: 401,
        statusText: 'Unauthorized',
      });

      expect(service.error()).toBe('Token missing.');
      expect(service.loading()).toBe(false);
    });
  });

  describe('API #14: getUnreadCount', () => {
    it('1. should call GET /organization/notifications/unread-count with Bearer token', () => {
      service.getUnreadCount().subscribe();

      const req = httpTestingController.expectOne(unreadCountUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-university-token'
      );

      req.flush(mockUnreadCountResponse);
    });

    it('2. should map unread count directly to unreadCount signal', () => {
      service.getUnreadCount().subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res.data.count).toBe(3);
      });

      const req = httpTestingController.expectOne(unreadCountUrl);
      req.flush(mockUnreadCountResponse);

      expect(service.unreadCount()).toBe(3);
      expect(service.countLoading()).toBe(false);
    });
  });

  describe('API #15: markAsRead', () => {
    it('1. should call PATCH /organization/notifications/:id/read with Bearer token and no body', () => {
      service.notifications.set([mockNotification]);

      service.markAsRead(notificationId).subscribe();

      const req = httpTestingController.expectOne(markReadUrl);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toBeNull();
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-university-token'
      );

      req.flush(mockMarkReadResponse);

      // Verify unread-count refresh call
      const countReq = httpTestingController.expectOne(unreadCountUrl);
      expect(countReq.request.method).toBe('GET');
      countReq.flush({ success: true, data: { count: 2 } });

      expect(service.notifications()[0].read).toBe(true);
      expect(service.notifications()[0].readAt).toBe(
        '2026-08-19T01:25:00.000Z'
      );
      expect(service.unreadCount()).toBe(2);
      expect(service.markingReadId()).toBeNull();
    });

    it('2. should handle 404 Not Found error on markAsRead', () => {
      service.markAsRead(notificationId).subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(markReadUrl);
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(service.error()).toBe(
        'Notification not found or already processed.'
      );
      expect(service.markingReadId()).toBeNull();
    });

    it('3. should handle 401 Unauthorized on markAsRead', () => {
      service.markAsRead(notificationId).subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(markReadUrl);
      req.flush({ message: 'Session expired.' }, {
        status: 401,
        statusText: 'Unauthorized',
      });

      expect(service.error()).toBe('Session expired.');
      expect(service.markingReadId()).toBeNull();
    });

    it('4. should handle 500 Server Error on markAsRead', () => {
      service.markAsRead(notificationId).subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(markReadUrl);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(service.error()).toBe(
        'Internal server error while processing notifications. Please try again.'
      );
      expect(service.markingReadId()).toBeNull();
    });
  });

  describe('API #16: markAllAsRead', () => {
    it('1. should call PATCH /organization/notifications/read-all with Bearer token and no body', () => {
      service.notifications.set([
        mockNotification,
        { ...mockNotification, _id: 'notif-2' },
      ]);

      service.markAllAsRead().subscribe();

      const req = httpTestingController.expectOne(markAllReadUrl);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toBeNull();
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-university-token'
      );

      req.flush(mockMarkAllReadResponse);

      // Verify unread-count refresh call
      const countReq = httpTestingController.expectOne(unreadCountUrl);
      expect(countReq.request.method).toBe('GET');
      countReq.flush({ success: true, data: { count: 0 } });

      expect(service.notifications().every((n) => n.read)).toBe(true);
      expect(service.unreadCount()).toBe(0);
      expect(service.markingAllRead()).toBe(false);
    });

    it('2. should handle 403 Forbidden error on markAllAsRead', () => {
      service.markAllAsRead().subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(markAllReadUrl);
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(service.error()).toBe(
        'Access denied. You do not have permission to modify organization notifications.'
      );
      expect(service.markingAllRead()).toBe(false);
    });

    it('3. should handle 500 Server Error on markAllAsRead', () => {
      service.markAllAsRead().subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(markAllReadUrl);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(service.error()).toBe(
        'Internal server error while processing notifications. Please try again.'
      );
      expect(service.markingAllRead()).toBe(false);
    });
  });
});
