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

    fixture.detectChanges();
  });

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

  it('should execute accept invite without crashing', () => {
    expect(() => component.onAcceptInvite()).not.toThrow();
  });

  it('should execute decline invite without crashing', () => {
    expect(() => component.onDeclineInvite({ reason: 'NOT_INTERESTED', note: '' })).not.toThrow();
  });
});
