import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { StudentInvitesComponent } from './student-invites.component';
import { InvitesService } from '../../../services/invites.service';
import { StudentProfileService } from '../../../services/student-profile.service';
import { environment } from '../../../../../../environments/environment';

describe('StudentInvitesComponent', () => {
  let component: StudentInvitesComponent;
  let fixture: ComponentFixture<StudentInvitesComponent>;
  let httpTesting: HttpTestingController;
  let invitesService: InvitesService;
  let profileService: StudentProfileService;

  const mockInvites = [
    {
      _id: 'inv-kazan-test-01',
      organizationName: 'Kazan State Medical University',
      organizationInfo: {
        name: 'Kazan State Medical University',
        country: 'Russia',
        city: 'Kazan',
      },
      title: 'General Medicine (MBBS)',
      description: 'Pre-approved offer',
      status: 'PENDING',
      createdAt: '2026-08-15T09:00:00.000Z',
      expiresAt: '2026-09-15T23:59:59.000Z',
    },
    {
      _id: 'inv-tma-test-02',
      organizationName: 'Tashkent Medical Academy',
      organizationInfo: {
        name: 'Tashkent Medical Academy',
        country: 'Uzbekistan',
        city: 'Tashkent',
      },
      title: 'General Medicine',
      description: 'Uzbekistan offer',
      status: 'VIEWED',
      createdAt: '2026-08-12T11:30:00.000Z',
      expiresAt: '2026-09-30T23:59:59.000Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentInvitesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        InvitesService,
        StudentProfileService,
      ],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    profileService = TestBed.inject(StudentProfileService);
    invitesService = TestBed.inject(InvitesService);

    // Initial service requests
    const profileReq = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile`);
    profileReq.flush({
      success: true,
      data: {
        personal: { fullName: 'Sanjay Sivakumar' },
        entranceExams: [{ score: 588, percentile: 97.42 }],
        completionPercentage: 100,
      },
    });

    const summaryReq = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/invites/summary`);
    summaryReq.flush({
      success: true,
      data: { total: 2, pending: 1, viewed: 1, accepted: 0, declined: 0, expired: 0, cancelled: 0 },
    });

    const listReq = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/invites?page=1&limit=20`
    );
    listReq.flush({
      success: true,
      data: {
        items: mockInvites,
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      },
    });

    fixture = TestBed.createComponent(StudentInvitesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }, 30000);

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create and render invites list from real backend response', () => {
    expect(component).toBeTruthy();
    expect(component.filteredInvites().length).toBe(2);
  });

  it('should filter invites when a filter status is selected', () => {
    component.onFilterSelected('PENDING');
    fixture.detectChanges();
    expect(component.activeFilter()).toBe('PENDING');
    expect(
      component.filteredInvites().every((i) => i.status === 'PENDING' || (i.status as string) === 'NEW')
    ).toBe(true);
    expect(component.filteredInvites().length).toBe(1);
  });

  it('should filter invites by search query', () => {
    component.onSearchChanged('Kazan');
    fixture.detectChanges();
    expect(component.filteredInvites().length).toBe(1);
    expect(component.filteredInvites()[0].university.name).toContain('Kazan');
  });

  it('should show empty state when list is empty', () => {
    component.onSearchChanged('NonExistentUniversitySearch');
    fixture.detectChanges();
    expect(component.filteredInvites().length).toBe(0);
  });
});
