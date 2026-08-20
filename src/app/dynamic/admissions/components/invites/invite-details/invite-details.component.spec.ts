import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { InviteDetailsComponent } from './invite-details.component';
import { InvitesService } from '../../../services/invites.service';
import { environment } from '../../../../../../environments/environment';

describe('InviteDetailsComponent', () => {
  let component: InviteDetailsComponent;
  let fixture: ComponentFixture<InviteDetailsComponent>;
  let httpTesting: HttpTestingController;
  let invitesService: InvitesService;

  const mockDetailInvite = {
    _id: 'inv-kazan-2026',
    studentId: 'student-100',
    organizationId: 'org-kazan-01',
    organizationName: 'Kazan State Medical University',
    organizationInfo: {
      name: 'Kazan State Medical University',
      country: 'Russia',
      city: 'Kazan',
      logo: 'https://example.com/logo.png',
      website: 'https://kazangmu.ru',
    },
    title: 'General Medicine (MBBS)',
    description: 'Formal university invite letter.',
    status: 'PENDING',
    createdAt: '2026-08-15T09:00:00.000Z',
    expiresAt: '2026-09-15T23:59:59.000Z',
  };

  const mockHistoryItems = [
    {
      _id: 'hist-init-1',
      action: 'CREATED',
      title: 'Invitation Issued',
      description: 'Admission offer created by university.',
      actor: 'Kazan State Medical University',
      createdAt: '2026-08-15T09:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InviteDetailsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        InvitesService,
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ inviteId: 'inv-kazan-2026' })),
          },
        },
      ],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    invitesService = TestBed.inject(InvitesService);

    // Initial invites service requests on instantiation
    const summaryReq = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/invites/summary`);
    summaryReq.flush({
      success: true,
      data: { total: 1, pending: 1, viewed: 0, accepted: 0, declined: 0, expired: 0, cancelled: 0 },
    });

    const listReq = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites?page=1&limit=20`
    );
    listReq.flush({
      success: true,
      data: {
        items: [mockDetailInvite],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    });

    fixture = TestBed.createComponent(InviteDetailsComponent);
    component = fixture.componentInstance;

    // Component's paramMap triggers GET /student/invites/inv-kazan-2026
    const detailReq = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/inv-kazan-2026`
    );
    expect(detailReq.request.method).toBe('GET');
    detailReq.flush({
      success: true,
      data: mockDetailInvite,
    });

    // Opening a PENDING invite triggers POST /student/invites/inv-kazan-2026/view
    const viewReq = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/inv-kazan-2026/view`
    );
    expect(viewReq.request.method).toBe('POST');
    viewReq.flush({
      success: true,
      data: { ...mockDetailInvite, status: 'VIEWED', viewedAt: '2026-08-19T09:30:00.000Z' },
    });

    // View API triggers summary refresh
    const summaryRefreshReq = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/summary`
    );
    summaryRefreshReq.flush({
      success: true,
      data: { total: 1, pending: 0, viewed: 1, accepted: 0, declined: 0, expired: 0, cancelled: 0 },
    });

    // Triggers GET /student/invites/inv-kazan-2026/history
    const historyReq = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/inv-kazan-2026/history`
    );
    expect(historyReq.request.method).toBe('GET');
    historyReq.flush({
      success: true,
      data: mockHistoryItems,
    });

    fixture.detectChanges();
  }, 30000);

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create and load the specific invite from real GET /student/invites/:inviteId and mark as VIEWED', () => {
    expect(component).toBeTruthy();
    const inv = component.invite();
    expect(inv).toBeDefined();
    expect(inv?.id).toBe('inv-kazan-2026');
    expect(inv?.university.name).toBe('Kazan State Medical University');
    expect(inv?.university.country).toBe('Russia');
    expect(inv?.title).toBe('General Medicine (MBBS)');
    expect(inv?.status).toBe('VIEWED');
  });

  it('should load and render history items on init', () => {
    const history = component.history();
    expect(history.length).toBe(1);
    expect(history[0].title).toBe('Invitation Issued');
    expect(history[0].actor).toBe('Kazan State Medical University');
  });

  it('should successfully call accept API and update status to ACCEPTED on backend success', () => {
    component.onAcceptInvite();
    expect(component.accepting()).toBe(true);

    const acceptReq = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/inv-kazan-2026/accept`
    );
    expect(acceptReq.request.method).toBe('POST');
    expect(acceptReq.request.body).toEqual({});
    acceptReq.flush({
      success: true,
      data: {
        ...mockDetailInvite,
        status: 'ACCEPTED',
        respondedAt: '2026-08-20T12:00:00.000Z',
      },
    });

    const summaryRefresh = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/summary`
    );
    summaryRefresh.flush({
      success: true,
      data: { total: 1, pending: 0, viewed: 0, accepted: 1, declined: 0, expired: 0, cancelled: 0 },
    });

    const historyReload = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/inv-kazan-2026/history`
    );
    historyReload.flush({
      success: true,
      data: [
        ...mockHistoryItems,
        { action: 'ACCEPTED', title: 'Invitation Accepted', createdAt: '2026-08-20T12:00:00.000Z' },
      ],
    });

    expect(component.accepting()).toBe(false);
    expect(component.actionSuccess()).toBeTruthy();
    expect(component.invite()?.status).toBe('ACCEPTED');
    expect(component.history().length).toBe(2);
  });

  it('should prevent duplicate clicks while accept API request is in-flight', () => {
    component.onAcceptInvite();
    expect(component.accepting()).toBe(true);

    // Trigger second accept while first is running
    component.onAcceptInvite();

    // Only one HTTP request should be in-flight
    const acceptReq = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/inv-kazan-2026/accept`
    );
    acceptReq.flush({
      success: true,
      data: {
        ...mockDetailInvite,
        status: 'ACCEPTED',
      },
    });

    const summaryRefresh = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/summary`
    );
    summaryRefresh.flush({
      success: true,
      data: { total: 1, pending: 0, viewed: 0, accepted: 1, declined: 0, expired: 0, cancelled: 0 },
    });

    const historyReload = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/inv-kazan-2026/history`
    );
    historyReload.flush({ success: true, data: mockHistoryItems });

    expect(component.accepting()).toBe(false);
  });

  it('should handle 409 conflict error properly without falsely showing ACCEPTED', () => {
    component.onAcceptInvite();
    expect(component.accepting()).toBe(true);

    const acceptReq = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/inv-kazan-2026/accept`
    );
    acceptReq.flush(
      { success: false, code: 'INVALID_STATE_TRANSITION', message: 'Offer is no longer active' },
      { status: 409, statusText: 'Conflict' }
    );

    expect(component.accepting()).toBe(false);
    expect(component.actionError()).toContain('Offer is no longer active');
    expect(component.invite()?.status).toBe('VIEWED'); // Remains VIEWED, not falsely ACCEPTED
  });

  it('should handle 500 server error properly without falsely showing ACCEPTED', () => {
    component.onAcceptInvite();
    expect(component.accepting()).toBe(true);

    const acceptReq = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/inv-kazan-2026/accept`
    );
    acceptReq.flush(
      { success: false, message: 'Internal Server Error' },
      { status: 500, statusText: 'Server Error' }
    );

    expect(component.accepting()).toBe(false);
    expect(component.actionError()).toContain('Internal Server Error');
    expect(component.invite()?.status).toBe('VIEWED');
  });

  it('should successfully call decline API and update status to DECLINED on backend success', () => {
    component.onDeclineInvite({ reason: 'NOT_INTERESTED', note: 'Pursuing domestic options' });
    expect(component.declining()).toBe(true);

    const declineReq = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/inv-kazan-2026/decline`
    );
    expect(declineReq.request.method).toBe('POST');
    expect(declineReq.request.body).toEqual({
      reason: 'NOT_INTERESTED',
      note: 'Pursuing domestic options',
    });
    declineReq.flush({
      success: true,
      data: {
        ...mockDetailInvite,
        status: 'DECLINED',
        respondedAt: '2026-08-20T12:45:00.000Z',
      },
    });

    const summaryRefresh = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/summary`
    );
    summaryRefresh.flush({
      success: true,
      data: { total: 1, pending: 0, viewed: 0, accepted: 0, declined: 1, expired: 0, cancelled: 0 },
    });

    const historyReload = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/inv-kazan-2026/history`
    );
    historyReload.flush({
      success: true,
      data: [
        ...mockHistoryItems,
        { action: 'DECLINED', title: 'Invitation Declined', createdAt: '2026-08-20T12:45:00.000Z' },
      ],
    });

    expect(component.declining()).toBe(false);
    expect(component.actionSuccess()).toBeTruthy();
    expect(component.invite()?.status).toBe('DECLINED');
    expect(component.history().length).toBe(2);
  });

  it('should prevent duplicate clicks while decline API request is in-flight', () => {
    component.onDeclineInvite({ reason: 'NOT_INTERESTED', note: '' });
    expect(component.declining()).toBe(true);

    // Trigger second decline while first is running
    component.onDeclineInvite({ reason: 'OTHER', note: '' });

    // Only one HTTP request should be in-flight
    const declineReq = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/inv-kazan-2026/decline`
    );
    declineReq.flush({
      success: true,
      data: {
        ...mockDetailInvite,
        status: 'DECLINED',
      },
    });

    const summaryRefresh = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/summary`
    );
    summaryRefresh.flush({
      success: true,
      data: { total: 1, pending: 0, viewed: 0, accepted: 0, declined: 1, expired: 0, cancelled: 0 },
    });

    const historyReload = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/inv-kazan-2026/history`
    );
    historyReload.flush({ success: true, data: mockHistoryItems });

    expect(component.declining()).toBe(false);
  });

  it('should handle 409 conflict error on decline properly without falsely showing DECLINED', () => {
    component.onDeclineInvite({ reason: 'TUITION', note: '' });
    expect(component.declining()).toBe(true);

    const declineReq = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/inv-kazan-2026/decline`
    );
    declineReq.flush(
      { success: false, code: 'INVALID_STATE_TRANSITION', message: 'Offer is no longer active' },
      { status: 409, statusText: 'Conflict' }
    );

    expect(component.declining()).toBe(false);
    expect(component.actionError()).toContain('Offer is no longer active');
    expect(component.invite()?.status).toBe('VIEWED'); // Remains VIEWED, not falsely DECLINED
  });

  it('should handle 500 server error on decline properly without falsely showing DECLINED', () => {
    component.onDeclineInvite({ reason: 'OTHER', note: '' });
    expect(component.declining()).toBe(true);

    const declineReq = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/inv-kazan-2026/decline`
    );
    declineReq.flush(
      { success: false, message: 'Internal Server Error' },
      { status: 500, statusText: 'Server Error' }
    );

    expect(component.declining()).toBe(false);
    expect(component.actionError()).toContain('Internal Server Error');
    expect(component.invite()?.status).toBe('VIEWED');
  });

  it('should handle history fetch failure gracefully without breaking invite details', () => {
    component.loadInviteHistory('inv-kazan-2026');
    expect(component.historyLoading()).toBe(true);

    const historyReq = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites/inv-kazan-2026/history`
    );
    historyReq.flush(
      { success: false, message: 'Activity not found' },
      { status: 404, statusText: 'Not Found' }
    );

    expect(component.historyLoading()).toBe(false);
    expect(component.historyError()).toBe('Activity not found');
    expect(component.invite()).toBeDefined(); // Invite details remain intact
  });
});
