import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { UniversityIdentity } from '../../../auth/models/university-auth.model';
import { UniversityAuthService } from '../../../auth/services/university-auth.service';
import {
  StudentPagination,
  UniversityStudent,
} from '../../models/university-student.model';
import { UniversityStudentsService } from '../../services/university-students.service';
import { UniversityStudentsComponent } from './university-students';

describe('UniversityStudentsComponent', () => {
  let component: UniversityStudentsComponent;
  let fixture: ComponentFixture<UniversityStudentsComponent>;
  let authServiceMock: {
    currentUser: ReturnType<typeof signal<UniversityIdentity | null>>;
  };
  let studentsServiceMock: {
    students: ReturnType<typeof signal<UniversityStudent[]>>;
    pagination: ReturnType<typeof signal<StudentPagination | null>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    getStudents: ReturnType<typeof vi.fn>;
  };

  const mockStudents: UniversityStudent[] = [
    {
      studentId: 'STU17869056359535Q01Q3',
      personal: {
        fullName: 'Ananya Sharma',
        city: 'Delhi',
        country: 'India',
        nationality: 'Indian',
      },
      academic: {
        tenthMarks: 480,
        twelfthMarks: 470,
        pcbPercentage: 94,
        twelfthBoard: 'CBSE',
        schoolName: 'Delhi Public School',
      },
      entrance: {
        neetScore: 610,
        neetYear: 2025,
        neetQualified: true,
        ucatScore: null,
      },
      preferences: {
        preferredCountries: ['Georgia', 'Russia'],
        preferredBudgetUsd: 25000,
        preferredIntake: 'September',
        preferredLanguage: 'English',
        course: 'MBBS',
      },
      profileCompletion: 100,
      createdAt: '2026-08-18T18:00:00.000Z',
    },
  ];

  const mockPagination: StudentPagination = {
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
  };

  beforeEach(async () => {
    authServiceMock = {
      currentUser: signal<UniversityIdentity | null>({
        id: 'ORG_TSMU_001',
        organizationId: 'ORG_TSMU_001',
        name: 'Tbilisi State Medical University',
        code: 'TSMU',
        email: 'admissions@tsmu.edu',
        role: 'UNIVERSITY_ADMIN',
        country: 'Georgia',
        city: 'Tbilisi',
      }),
    };

    studentsServiceMock = {
      students: signal<UniversityStudent[]>(mockStudents),
      pagination: signal<StudentPagination | null>(mockPagination),
      loading: signal(false),
      error: signal<string | null>(null),
      getStudents: vi.fn().mockReturnValue(
        of({
          success: true,
          data: { items: mockStudents, pagination: mockPagination },
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [UniversityStudentsComponent],
      providers: [
        provideRouter([]),
        { provide: UniversityAuthService, useValue: authServiceMock },
        { provide: UniversityStudentsService, useValue: studentsServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UniversityStudentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }, 30000);

  it('should create UniversityStudentsComponent and fetch students on init', () => {
    expect(component).toBeTruthy();
    expect(studentsServiceMock.getStudents).toHaveBeenCalled();
  });

  it('should render candidate student card with full details from backend response', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const nameEl = compiled.querySelector('.student-name');
    const idBadge = compiled.querySelector('.student-id-badge');
    const neetScore = compiled.querySelector('.highlight-score');
    const pcbVal = compiled.querySelector('.student-details-grid .value');

    expect(nameEl?.textContent).toContain('Ananya Sharma');
    expect(idBadge?.textContent).toContain('STU17869056359535Q01Q3');
    expect(neetScore?.textContent).toContain('610');
  });

  it('should trigger backend search when search input is debounced', () => {
    vi.useFakeTimers();
    try {
      component.onSearchInput('Sharma');
      vi.advanceTimersByTime(400);

      expect(studentsServiceMock.getStudents).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Sharma', page: 1 })
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('should apply filters and call getStudents with non-empty filter parameters', () => {
    component.country = 'Georgia';
    component.minNeetScore = 500;
    component.minPcb = 85;
    component.onFilterSubmit();

    expect(studentsServiceMock.getStudents).toHaveBeenCalledWith(
      expect.objectContaining({
        country: 'Georgia',
        minNeetScore: 500,
        minPcb: 85,
        page: 1,
      })
    );
  });

  it('should reset all filters and reload candidate pool with defaults', () => {
    component.country = 'Georgia';
    component.minNeetScore = 600;
    component.resetFilters();

    expect(component.country).toBe('');
    expect(component.minNeetScore).toBeNull();
    expect(studentsServiceMock.getStudents).toHaveBeenCalledWith(
      expect.objectContaining({
        country: undefined,
        minNeetScore: undefined,
        page: 1,
      })
    );
  });

  it('should change sorting column and toggle sortOrder', () => {
    component.setSorting('neetScore');
    expect(component.sortBy()).toBe('neetScore');
    expect(component.sortOrder()).toBe('desc');

    // Clicking same column toggles order to asc
    component.setSorting('neetScore');
    expect(component.sortOrder()).toBe('asc');
  });

  it('should navigate to valid page when pagination button is clicked', () => {
    studentsServiceMock.pagination.set({
      page: 1,
      limit: 20,
      total: 45,
      totalPages: 3,
    });
    fixture.detectChanges();

    component.goToPage(2);
    expect(component.currentPage()).toBe(2);
    expect(studentsServiceMock.getStudents).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 })
    );
  });

  it('should render clean empty state when no students are returned', () => {
    studentsServiceMock.students.set([]);
    studentsServiceMock.pagination.set({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emptyState = compiled.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('No Student Candidates Found');
  });

  it('should render error alert with retry button on API failure', () => {
    studentsServiceMock.students.set([]);
    studentsServiceMock.error.set('Failed to connect to candidate search API.');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const errorAlert = compiled.querySelector('.alert-card.error');
    expect(errorAlert).toBeTruthy();
    expect(errorAlert?.textContent).toContain('Failed to connect to candidate search API.');

    const retryBtn = compiled.querySelector('.btn-retry') as HTMLButtonElement;
    expect(retryBtn).toBeTruthy();

    retryBtn.click();
    expect(studentsServiceMock.getStudents).toHaveBeenCalled();
  });

  it('should render invitation sent badges on student card when student has active invite while keeping card viewable', () => {
    const invitedStudent: UniversityStudent = {
      ...mockStudents[0],
      hasActiveInvite: true,
      inviteStatus: 'PENDING',
    };

    studentsServiceMock.students.set([invitedStudent]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const inviteBadge = compiled.querySelector('.invite-status-badge');
    const invitedPill = compiled.querySelector('.invited-pill');
    const viewProfileBtn = compiled.querySelector('.btn-view-profile');

    expect(inviteBadge).toBeTruthy();
    expect(inviteBadge?.textContent).toContain('Invitation Sent');
    expect(invitedPill).toBeTruthy();
    expect(invitedPill?.textContent).toContain('Invitation Already Sent');
    expect(viewProfileBtn).toBeTruthy();
    expect(viewProfileBtn?.getAttribute('href')).toBe('/university/students/STU17869056359535Q01Q3');
  });
});
