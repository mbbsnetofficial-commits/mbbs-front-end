import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import {
  UniversityNotification,
  UniversityNotificationPagination,
} from '../../models/university-notification.model';
import { UniversityNotificationsService } from '../../services/university-notifications.service';
import { UniversityNotificationsComponent } from './university-notifications';

describe('UniversityNotificationsComponent', () => {
  let component: UniversityNotificationsComponent;
  let fixture: ComponentFixture<UniversityNotificationsComponent>;
  let notificationsServiceMock: {
    notifications: ReturnType<typeof signal<UniversityNotification[]>>;
    pagination: ReturnType<
      typeof signal<UniversityNotificationPagination | null>
    >;
    unreadCount: ReturnType<typeof signal<number>>;
    loading: ReturnType<typeof signal<boolean>>;
    countLoading: ReturnType<typeof signal<boolean>>;
    markingReadId: ReturnType<typeof signal<string | null>>;
    markingAllRead: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    countError: ReturnType<typeof signal<string | null>>;
    getNotifications: ReturnType<typeof vi.fn>;
    getUnreadCount: ReturnType<typeof vi.fn>;
    markAsRead: ReturnType<typeof vi.fn>;
    markAllAsRead: ReturnType<typeof vi.fn>;
  };

  const mockNotificationUnread: UniversityNotification = {
    _id: '67b36f2a4e9b8a0012345690',
    organizationId: 'ORG_TSMU_001',
    type: 'INVITE_SENT',
    title: 'Invitation Sent',
    message:
      'Invitation successfully sent to student (STU17869056359535Q01Q3).',
    read: false,
    createdAt: '2026-08-19T01:10:00.000Z',
  };

  const mockNotificationRead: UniversityNotification = {
    _id: '67b36f2a4e9b8a0012345691',
    organizationId: 'ORG_TSMU_001',
    type: 'OFFER_ACCEPTED',
    title: 'Admission Offer Accepted',
    message: 'Candidate has accepted the admission offer.',
    read: true,
    createdAt: '2026-08-18T14:30:00.000Z',
  };

  const mockPagination: UniversityNotificationPagination = {
    page: 1,
    limit: 20,
    total: 25,
    totalPages: 2,
  };

  beforeEach(async () => {
    notificationsServiceMock = {
      notifications: signal<UniversityNotification[]>([
        mockNotificationUnread,
        mockNotificationRead,
      ]),
      pagination: signal<UniversityNotificationPagination | null>(
        mockPagination
      ),
      unreadCount: signal<number>(1),
      loading: signal<boolean>(false),
      countLoading: signal<boolean>(false),
      markingReadId: signal<string | null>(null),
      markingAllRead: signal<boolean>(false),
      error: signal<string | null>(null),
      countError: signal<string | null>(null),
      getNotifications: vi.fn().mockReturnValue(
        of({
          success: true,
          data: {
            items: [mockNotificationUnread, mockNotificationRead],
            pagination: mockPagination,
          },
        })
      ),
      getUnreadCount: vi.fn().mockReturnValue(
        of({
          success: true,
          data: { count: 1 },
        })
      ),
      markAsRead: vi.fn().mockReturnValue(
        of({
          success: true,
          message: 'Notification marked as read',
          data: {
            _id: mockNotificationUnread._id,
            read: true,
            readAt: '2026-08-19T01:25:00.000Z',
          },
        })
      ),
      markAllAsRead: vi.fn().mockReturnValue(
        of({
          success: true,
          message: 'All notifications marked as read',
          data: {
            success: true,
            markedCount: 1,
          },
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [UniversityNotificationsComponent],
      providers: [
        provideRouter([]),
        {
          provide: UniversityNotificationsService,
          useValue: notificationsServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UniversityNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }, 30000);

  it('should create UniversityNotificationsComponent and load notifications & unread count on init', () => {
    expect(component).toBeTruthy();
    expect(notificationsServiceMock.getNotifications).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      unreadOnly: false,
    });
    expect(notificationsServiceMock.getUnreadCount).toHaveBeenCalled();
  });

  it('should render notification items with title, type, message, and date', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.notification-card');
    expect(cards.length).toBe(2);

    const firstCard = cards[0];
    expect(firstCard.textContent).toContain('Invitation Sent');
    expect(firstCard.textContent).toContain('INVITE_SENT');
    expect(firstCard.textContent).toContain(
      'Invitation successfully sent to student'
    );
  });

  describe('API #15: Mark Single Notification as Read', () => {
    it('1. should call markAsRead when clicking an unread notification', () => {
      component.onNotificationClick(mockNotificationUnread);

      expect(notificationsServiceMock.markAsRead).toHaveBeenCalledWith(
        mockNotificationUnread._id
      );
    });

    it('2. should NOT call markAsRead if notification is already read', () => {
      component.onNotificationClick(mockNotificationRead);

      expect(notificationsServiceMock.markAsRead).not.toHaveBeenCalled();
    });

    it('3. should NOT call markAsRead if another request for the same ID is already in progress', () => {
      notificationsServiceMock.markingReadId.set(mockNotificationUnread._id);

      component.onNotificationClick(mockNotificationUnread);

      expect(notificationsServiceMock.markAsRead).not.toHaveBeenCalled();
    });

    it('4. should preserve unread visual state if markAsRead fails', () => {
      notificationsServiceMock.markAsRead.mockReturnValue(
        throwError(() => ({
          error: { message: 'Failed to update notification status' },
          status: 500,
        }))
      );

      component.onNotificationClick(mockNotificationUnread);

      expect(notificationsServiceMock.markAsRead).toHaveBeenCalledWith(
        mockNotificationUnread._id
      );
      expect(mockNotificationUnread.read).toBe(false);
    });
  });

  describe('API #16: Mark All Notifications as Read', () => {
    it('1. should call markAllAsRead when Mark all as read button is clicked', () => {
      component.onMarkAllAsRead();

      expect(notificationsServiceMock.markAllAsRead).toHaveBeenCalled();
    });

    it('2. should NOT call markAllAsRead if unreadCount is 0', () => {
      notificationsServiceMock.unreadCount.set(0);

      component.onMarkAllAsRead();

      expect(notificationsServiceMock.markAllAsRead).not.toHaveBeenCalled();
    });

    it('3. should NOT call markAllAsRead if markAllAsRead is already in progress', () => {
      notificationsServiceMock.markingAllRead.set(true);

      component.onMarkAllAsRead();

      expect(notificationsServiceMock.markAllAsRead).not.toHaveBeenCalled();
    });

    it('4. should render Mark all as read button in header when unreadCount > 0', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const markAllBtn = compiled.querySelector('.btn-mark-all-read');
      expect(markAllBtn).toBeTruthy();
      expect(markAllBtn?.textContent).toContain('Mark all as read');
    });

    it('5. should show spinner inside button when markingAllRead is true', () => {
      notificationsServiceMock.markingAllRead.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const markAllBtn = compiled.querySelector('.btn-mark-all-read');
      expect(markAllBtn?.textContent).toContain('Marking all read...');
      expect(markAllBtn?.querySelector('.spinner-small')).toBeTruthy();
    });
  });

  describe('Filters & Query State', () => {
    it('should toggle unreadOnly filter and reload page 1 with unreadOnly: true', () => {
      component.setFilter(true);
      fixture.detectChanges();

      expect(component.unreadOnlyFilter()).toBe(true);
      expect(notificationsServiceMock.getNotifications).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        unreadOnly: true,
      });
    });

    it('should switch back to All filter and reload page 1 with unreadOnly: false', () => {
      component.setFilter(true);
      component.setFilter(false);

      expect(component.unreadOnlyFilter()).toBe(false);
      expect(notificationsServiceMock.getNotifications).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        unreadOnly: false,
      });
    });
  });

  describe('Pagination Controls', () => {
    it('should render pagination bar and call getNotifications with page 2 on page change', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const paginationNav = compiled.querySelector('.pagination-nav');
      expect(paginationNav).toBeTruthy();
      expect(paginationNav?.textContent).toContain('Page 1 of 2');

      component.goToPage(2);

      expect(notificationsServiceMock.getNotifications).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        unreadOnly: false,
      });
      expect(component.currentPage()).toBe(2);
    });
  });

  describe('UI States', () => {
    it('should render clean empty state when no notifications exist', () => {
      notificationsServiceMock.notifications.set([]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const emptyState = compiled.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState?.textContent).toContain('No Notifications Yet');
    });

    it('should render error alert and retry on button click', () => {
      notificationsServiceMock.notifications.set([]);
      notificationsServiceMock.error.set('Failed to load notifications.');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const errorAlert = compiled.querySelector('.alert-card.error');
      expect(errorAlert).toBeTruthy();
      expect(errorAlert?.textContent).toContain('Notification Request Failed');

      const retryBtn = compiled.querySelector('.btn-retry') as HTMLButtonElement;
      expect(retryBtn).toBeTruthy();

      retryBtn.click();
      expect(notificationsServiceMock.getNotifications).toHaveBeenCalledTimes(2);
      expect(notificationsServiceMock.getUnreadCount).toHaveBeenCalledTimes(2);
    });
  });
});
