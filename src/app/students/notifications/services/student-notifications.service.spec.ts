import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { StudentNotificationsService } from './student-notifications.service';
import { environment } from '../../../../environments/environment';
import { STUDENT_NOTIFICATIONS_API } from '../constants/student-notifications.constants';
import {
  StudentNotification,
  StudentNotificationListResponse,
  StudentNotificationUnreadCountResponse,
} from '../models/student-notification.model';

describe('StudentNotificationsService', () => {
  let service: StudentNotificationsService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  const mockNotification: StudentNotification = {
    _id: '66d691e843b0c4874ef1a251',
    user_id: '66d68ea743b0c4874ef1a240',
    student_id: 'STU12345',
    title: 'New Test Available',
    message: 'Biology Grand Mock Test 2026 is now live.',
    notification_type: 'test',
    priority: 'high',
    action_url: '/tests/neet-mock-2026',
    data: { test_id: '66d68fa743b0c4874ef1a288' },
    is_read: false,
    read_at: null,
    is_deleted: false,
    deleted_at: null,
    created_at: '2026-09-03T17:15:00.000Z',
    updated_at: '2026-09-03T17:15:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StudentNotificationsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(StudentNotificationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.notifications()).toEqual([]);
    expect(service.unreadCount()).toBe(0);
  });

  it('1. should fetch unread count and update signal', () => {
    const mockResponse: StudentNotificationUnreadCountResponse = {
      status: 'success',
      data: { unread_count: 5 },
    };

    service.getUnreadCount().subscribe((res) => {
      expect(res.data.unread_count).toBe(5);
      expect(service.unreadCount()).toBe(5);
    });

    const req = httpMock.expectOne(
      `${baseUrl}${STUDENT_NOTIFICATIONS_API.UNREAD_COUNT}`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('2. should fetch notifications list and update signals', () => {
    const mockResponse: StudentNotificationListResponse = {
      status: 'success',
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      data: [mockNotification],
    };

    service.getNotifications({ page: 1, limit: 20 }).subscribe((res) => {
      expect(res.data.length).toBe(1);
      expect(service.notifications().length).toBe(1);
      expect(service.notifications()[0]._id).toBe('66d691e843b0c4874ef1a251');
      expect(service.total()).toBe(1);
    });

    const req = httpMock.expectOne((r) =>
      r.url.startsWith(`${baseUrl}${STUDENT_NOTIFICATIONS_API.LIST}`)
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('20');
    req.flush(mockResponse);
  });

  it('3. should mark a single notification as read optimistically', () => {
    service.notifications.set([mockNotification]);
    service.unreadCount.set(1);

    service.markAsRead(mockNotification._id).subscribe((res) => {
      expect(res.status).toBe('success');
    });

    // Optimistic check
    expect(service.notifications()[0].is_read).toBe(true);
    expect(service.unreadCount()).toBe(0);

    const req = httpMock.expectOne(
      `${baseUrl}${STUDENT_NOTIFICATIONS_API.MARK_READ(mockNotification._id)}`
    );
    expect(req.request.method).toBe('PATCH');
    req.flush({
      status: 'success',
      message: 'Notification marked as read.',
      data: { ...mockNotification, is_read: true },
    });
  });

  it('4. should mark all notifications as read optimistically', () => {
    service.notifications.set([
      mockNotification,
      { ...mockNotification, _id: 'notif-2', is_read: false },
    ]);
    service.unreadCount.set(2);

    service.markAllAsRead().subscribe((res) => {
      expect(res.status).toBe('success');
    });

    expect(service.notifications().every((n) => n.is_read)).toBe(true);
    expect(service.unreadCount()).toBe(0);

    const req = httpMock.expectOne(
      `${baseUrl}${STUDENT_NOTIFICATIONS_API.MARK_ALL_READ}`
    );
    expect(req.request.method).toBe('PATCH');
    req.flush({
      status: 'success',
      message: 'All notifications marked as read.',
      data: { updated_count: 2 },
    });
  });

  it('5. should dismiss/delete notification and update signals', () => {
    service.notifications.set([mockNotification]);
    service.unreadCount.set(1);
    service.total.set(1);

    service.deleteNotification(mockNotification._id).subscribe((res) => {
      expect(res.status).toBe('success');
    });

    expect(service.notifications().length).toBe(0);
    expect(service.unreadCount()).toBe(0);
    expect(service.total()).toBe(0);

    const req = httpMock.expectOne(
      `${baseUrl}${STUDENT_NOTIFICATIONS_API.DELETE(mockNotification._id)}`
    );
    expect(req.request.method).toBe('DELETE');
    req.flush({
      status: 'success',
      message: 'Notification dismissed successfully.',
    });
  });
});
