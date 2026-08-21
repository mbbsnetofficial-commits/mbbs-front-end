import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UniversityIdentity } from '../auth/models/university-auth.model';
import { UniversityAuthService } from '../auth/services/university-auth.service';
import { UniversityInvitesService } from '../invites/services/university-invites.service';
import { UniversityNotificationsService } from '../notifications/services/university-notifications.service';
import { DashboardSummary } from './models/university-dashboard.model';
import { UniversityDashboardService } from './services/university-dashboard.service';
import { UniversityDashboardComponent } from './university-dashboard';

describe('UniversityDashboardComponent', () => {
  let component: UniversityDashboardComponent;
  let fixture: ComponentFixture<UniversityDashboardComponent>;
  let authServiceMock: {
    currentUser: ReturnType<typeof signal<UniversityIdentity | null>>;
    logoutLoading: ReturnType<typeof signal<boolean>>;
    logout: ReturnType<typeof vi.fn>;
  };
  let dashboardServiceMock: {
    summary: ReturnType<typeof signal<DashboardSummary | null>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    loadSummary: ReturnType<typeof vi.fn>;
  };
  let invitesServiceMock: {
    cancelling: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    cancelInvitation: ReturnType<typeof vi.fn>;
  };
  let notificationsServiceMock: {
    unreadCount: ReturnType<typeof signal<number>>;
    getUnreadCount: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  const mockIdentity: UniversityIdentity = {
    id: 'ORG_TSMU_001',
    organizationId: 'ORG_TSMU_001',
    name: 'Tbilisi State Medical University',
    code: 'TSMU',
    email: 'admissions@tsmu.edu',
    role: 'UNIVERSITY_ADMIN',
    country: 'Georgia',
    city: 'Tbilisi',
  };

  const mockSummaryData: DashboardSummary = {
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
  };

  beforeEach(async () => {
    authServiceMock = {
      currentUser: signal<UniversityIdentity | null>(mockIdentity),
      logoutLoading: signal(false),
      logout: vi.fn().mockReturnValue(of({ success: true, message: 'Logged out' })),
    };

    dashboardServiceMock = {
      summary: signal<DashboardSummary | null>(mockSummaryData),
      loading: signal(false),
      error: signal<string | null>(null),
      loadSummary: vi.fn().mockReturnValue(
        of({
          success: true,
          data: mockSummaryData,
        })
      ),
    };

    invitesServiceMock = {
      cancelling: signal(false),
      error: signal<string | null>(null),
      cancelInvitation: vi.fn().mockReturnValue(
        of({
          success: true,
          message: 'Invitation cancelled successfully',
          data: {
            _id: '67b36f1c4e9b8a0012345678',
            status: 'CANCELLED',
            cancelledAt: '2026-08-19T01:15:00.000Z',
          },
        })
      ),
    };

    notificationsServiceMock = {
      unreadCount: signal(0),
      getUnreadCount: vi.fn().mockReturnValue(
        of({
          success: true,
          data: { count: 0 },
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [UniversityDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: UniversityAuthService, useValue: authServiceMock },
        { provide: UniversityDashboardService, useValue: dashboardServiceMock },
        { provide: UniversityInvitesService, useValue: invitesServiceMock },
        {
          provide: UniversityNotificationsService,
          useValue: notificationsServiceMock,
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(UniversityDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create UniversityDashboardComponent and trigger loadSummary on init', () => {
    expect(component).toBeTruthy();
    expect(dashboardServiceMock.loadSummary).toHaveBeenCalled();
  });

  it('should display the real authenticated university name and details', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const nameEl = compiled.querySelector('.univ-name');
    expect(nameEl?.textContent).toContain('Tbilisi State Medical University');

    const emailEl = compiled.querySelector('.meta-value');
    expect(emailEl?.textContent).toContain('admissions@tsmu.edu');
  });

  it('should render all six KPI metric values from backend summary', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const kpiValues = Array.from(compiled.querySelectorAll('.kpi-value')).map((el) =>
      el.textContent?.trim()
    );

    expect(kpiValues).toContain('150'); // totalStudents
    expect(kpiValues).toContain('12');  // studentsViewed
    expect(kpiValues).toContain('25');  // invitesSent
    expect(kpiValues).toContain('10');  // pendingInvites
    expect(kpiValues).toContain('8');   // acceptedInvites
    expect(kpiValues).toContain('4');   // declinedInvites
  });

  it('should render recent invitations list with status badge and student ID', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const studentIdEl = compiled.querySelector('.student-id-tag');
    const statusPill = compiled.querySelector('.status-pill');
    const subjectEl = compiled.querySelector('.invite-subject');

    expect(studentIdEl?.textContent).toContain('STU17869056359535Q01Q3');
    expect(statusPill?.textContent?.trim()).toBe('PENDING');
    expect(statusPill?.classList.contains('status-pending')).toBe(true);
    expect(subjectEl?.textContent).toContain('Direct MBBS Admission Offer');
  });

  it('should render recent activity item with title and message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const titleEl = compiled.querySelector('.activity-title');
    const messageEl = compiled.querySelector('.activity-message');

    expect(titleEl?.textContent).toContain('Invitation Sent');
    expect(messageEl?.textContent).toContain('Invitation successfully sent to student');
  });

  it('should render clean empty states when recentInvites and recentActivity are empty', () => {
    dashboardServiceMock.summary.set({
      totalStudents: 0,
      studentsViewed: 0,
      invitesSent: 0,
      pendingInvites: 0,
      acceptedInvites: 0,
      declinedInvites: 0,
      recentInvites: [],
      recentActivity: [],
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emptyStates = compiled.querySelectorAll('.empty-state');
    expect(emptyStates.length).toBe(2);

    const emptyHeadings = Array.from(compiled.querySelectorAll('.empty-state h4')).map((el) =>
      el.textContent?.trim()
    );
    expect(emptyHeadings).toContain('No Invitations Sent');
    expect(emptyHeadings).toContain('No Recent Activity');
  });

  it('should display error alert with retry button when error occurs', () => {
    dashboardServiceMock.summary.set(null);
    dashboardServiceMock.error.set('Failed to connect to university metrics API.');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const errorAlert = compiled.querySelector('.alert-card.error');
    expect(errorAlert).toBeTruthy();
    expect(errorAlert?.textContent).toContain('Failed to connect to university metrics API.');

    const retryBtn = compiled.querySelector('.btn-retry') as HTMLButtonElement;
    expect(retryBtn).toBeTruthy();

    retryBtn.click();
    expect(dashboardServiceMock.loadSummary).toHaveBeenCalledTimes(2);
  });

  it('should call authService.logout() and navigate to /university/auth/login on logout', () => {
    component.logout();

    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/university/auth/login']);
  });

  describe('Cancel Invitation Flow', () => {
    const targetInvite = mockSummaryData.recentInvites[0];

    it('should open cancel confirmation modal when clicking Cancel button on a pending invite', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const cancelBtn = compiled.querySelector('.btn-cancel-action') as HTMLButtonElement;
      expect(cancelBtn).toBeTruthy();

      cancelBtn.click();
      fixture.detectChanges();

      expect(component.selectedInviteToCancel()).toEqual(targetInvite);
      const modal = compiled.querySelector('.modal-card');
      expect(modal).toBeTruthy();
      expect(modal?.textContent).toContain('Cancel this invitation?');
    });

    it('should call invitesService.cancelInvitation and update invite status to CANCELLED on confirmation', () => {
      component.promptCancelInvite(targetInvite);
      fixture.detectChanges();

      component.confirmCancelInvite();

      expect(invitesServiceMock.cancelInvitation).toHaveBeenCalledWith(targetInvite._id);
      expect(component.selectedInviteToCancel()).toBeNull();
      expect(component.cancelSuccessMessage()).toContain('cancelled successfully');

      const updatedInvites = dashboardServiceMock.summary()?.recentInvites;
      expect(updatedInvites?.[0].status).toBe('CANCELLED');
    });

    it('should keep previous status intact and show error when cancel API fails', () => {
      invitesServiceMock.cancelInvitation.mockReturnValue(
        throwError(() => ({
          error: { message: 'Conflict: Invitation is no longer pending.' },
          status: 409,
        }))
      );

      component.promptCancelInvite(targetInvite);
      fixture.detectChanges();

      component.confirmCancelInvite();

      expect(invitesServiceMock.cancelInvitation).toHaveBeenCalledWith(targetInvite._id);
      expect(component.cancelErrorMessage()).toBe('Conflict: Invitation is no longer pending.');
      expect(targetInvite.status).toBe('PENDING');
    });

    it('should close cancel modal when clicking Keep Invitation without calling API', () => {
      component.promptCancelInvite(targetInvite);
      fixture.detectChanges();

      component.closeCancelModal();
      fixture.detectChanges();

      expect(component.selectedInviteToCancel()).toBeNull();
      expect(invitesServiceMock.cancelInvitation).not.toHaveBeenCalled();
    });
  });
});
