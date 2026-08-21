import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { UniversityAuthService } from '../../auth/services/university-auth.service';
import {
  StudentDiscoveryFilters,
  UniversityStudentsResponse,
} from '../models/university-student.model';
import { UniversityStudentsService } from './university-students.service';

describe('UniversityStudentsService', () => {
  let service: UniversityStudentsService;
  let httpTestingController: HttpTestingController;
  let authServiceMock: { getToken: ReturnType<typeof vi.fn> };

  const expectedBaseUrl = `${environment.universityApiBaseUrl}/organization/students`;

  const mockStudentsResponse: UniversityStudentsResponse = {
    success: true,
    data: {
      items: [
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
        UniversityStudentsService,
        { provide: UniversityAuthService, useValue: authServiceMock },
      ],
    });

    service = TestBed.inject(UniversityStudentsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create UniversityStudentsService with initial empty state', () => {
    expect(service).toBeTruthy();
    expect(service.students()).toEqual([]);
    expect(service.pagination()).toBeNull();
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('should call GET /organization/students with default page=1, limit=20 and Bearer token', () => {
    service.getStudents().subscribe();

    const req = httpTestingController.expectOne(
      (r) =>
        r.url === expectedBaseUrl &&
        r.params.get('page') === '1' &&
        r.params.get('limit') === '20'
    );

    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe(
      'Bearer mock-university-token'
    );

    req.flush(mockStudentsResponse);
  });

  it('should attach all supported query parameters when provided', () => {
    const filters: StudentDiscoveryFilters = {
      page: 2,
      limit: 50,
      search: 'Ananya',
      country: 'Georgia',
      course: 'MBBS',
      minNeetScore: 500,
      minPcb: 85,
      maxBudget: 30000,
      profileCompletion: 80,
      sortBy: 'neetScore',
      sortOrder: 'desc',
    };

    service.getStudents(filters).subscribe();

    const req = httpTestingController.expectOne((r) => {
      const p = r.params;
      return (
        r.url === expectedBaseUrl &&
        p.get('page') === '2' &&
        p.get('limit') === '50' &&
        p.get('search') === 'Ananya' &&
        p.get('country') === 'Georgia' &&
        p.get('course') === 'MBBS' &&
        p.get('minNeetScore') === '500' &&
        p.get('minPcb') === '85' &&
        p.get('maxBudget') === '30000' &&
        p.get('profileCompletion') === '80' &&
        p.get('sortBy') === 'neetScore' &&
        p.get('sortOrder') === 'desc'
      );
    });

    expect(req.request.method).toBe('GET');
    req.flush(mockStudentsResponse);
  });

  it('should NOT send empty or whitespace parameters in query string', () => {
    const filters: StudentDiscoveryFilters = {
      search: '   ',
      country: '',
      course: undefined,
    };

    service.getStudents(filters).subscribe();

    const req = httpTestingController.expectOne(
      (r) =>
        r.url === expectedBaseUrl &&
        !r.params.has('search') &&
        !r.params.has('country') &&
        !r.params.has('course')
    );

    req.flush(mockStudentsResponse);
  });

  it('should map student items and pagination upon successful response', () => {
    service.getStudents().subscribe((res) => {
      expect(res.success).toBe(true);
    });

    const req = httpTestingController.expectOne(
      (r) => r.url === expectedBaseUrl
    );
    req.flush(mockStudentsResponse);

    expect(service.students().length).toBe(1);
    expect(service.students()[0].studentId).toBe('STU17869056359535Q01Q3');
    expect(service.students()[0].personal?.fullName).toBe('Ananya Sharma');
    expect(service.students()[0].entrance?.neetScore).toBe(610);
    expect(service.pagination()?.total).toBe(1);
    expect(service.pagination()?.totalPages).toBe(1);
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('should handle empty students list correctly without mock fallback', () => {
    const emptyResponse: UniversityStudentsResponse = {
      success: true,
      data: {
        items: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      },
    };

    service.getStudents().subscribe();

    const req = httpTestingController.expectOne(
      (r) => r.url === expectedBaseUrl
    );
    req.flush(emptyResponse);

    expect(service.students()).toEqual([]);
    expect(service.pagination()?.total).toBe(0);
  });

  it('should handle 400 Bad Request error', () => {
    service.getStudents().subscribe({ error: () => {} });

    const req = httpTestingController.expectOne(
      (r) => r.url === expectedBaseUrl
    );
    req.flush(
      { message: 'Invalid minNeetScore filter' },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(service.error()).toBe('Invalid minNeetScore filter');
    expect(service.loading()).toBe(false);
  });

  it('should handle 401 Unauthorized error without fake fallback data', () => {
    service.getStudents().subscribe({ error: () => {} });

    const req = httpTestingController.expectOne(
      (r) => r.url === expectedBaseUrl
    );
    req.flush(
      { message: 'University session expired' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(service.error()).toBe('University session expired');
    expect(service.loading()).toBe(false);
  });

  it('should handle 403 Forbidden error', () => {
    service.getStudents().subscribe({ error: () => {} });

    const req = httpTestingController.expectOne(
      (r) => r.url === expectedBaseUrl
    );
    req.flush(
      { message: 'Forbidden' },
      { status: 403, statusText: 'Forbidden' }
    );

    expect(service.error()).toBe('Forbidden');
    expect(service.loading()).toBe(false);
  });

  it('should handle 500 Internal Server Error', () => {
    service.getStudents().subscribe({ error: () => {} });

    const req = httpTestingController.expectOne(
      (r) => r.url === expectedBaseUrl
    );
    req.flush(
      { error: 'Database search query timed out' },
      { status: 500, statusText: 'Internal Server Error' }
    );

    expect(service.error()).toBe('Database search query timed out');
    expect(service.loading()).toBe(false);
  });

  it('should manage loading signal lifecycle during request', () => {
    expect(service.loading()).toBe(false);

    service.getStudents().subscribe();
    expect(service.loading()).toBe(true);

    const req = httpTestingController.expectOne(
      (r) => r.url === expectedBaseUrl
    );
    req.flush(mockStudentsResponse);

    expect(service.loading()).toBe(false);
  });

  it('should retain currentFilters and allow retry to re-execute with same filters', () => {
    const filters: StudentDiscoveryFilters = {
      country: 'Georgia',
      minNeetScore: 550,
      page: 1,
      limit: 20,
    };

    // First request fails
    service.getStudents(filters).subscribe({ error: () => {} });
    const req1 = httpTestingController.expectOne(
      (r) =>
        r.url === expectedBaseUrl &&
        r.params.get('country') === 'Georgia' &&
        r.params.get('minNeetScore') === '550'
    );
    req1.flush('Gateway timeout', {
      status: 504,
      statusText: 'Gateway Timeout',
    });

    expect(service.error()).toBeTruthy();

    // Retry with service.currentFilters()
    service.getStudents(service.currentFilters()).subscribe();
    const req2 = httpTestingController.expectOne(
      (r) =>
        r.url === expectedBaseUrl &&
        r.params.get('country') === 'Georgia' &&
        r.params.get('minNeetScore') === '550'
    );
    req2.flush(mockStudentsResponse);

    expect(service.students().length).toBe(1);
    expect(service.error()).toBeNull();
  });

  describe('getStudent(studentId)', () => {
    const studentId = 'STU17869056359535Q01Q3';
    const detailUrl = `${expectedBaseUrl}/${studentId}`;

    const mockDetailResponse = {
      success: true,
      data: mockStudentsResponse.data.items[0],
    };

    it('should call GET /organization/students/:studentId with Bearer token', () => {
      service.getStudent(studentId).subscribe();

      const req = httpTestingController.expectOne(detailUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-university-token'
      );

      req.flush(mockDetailResponse);
    });

    it('should map student profile data and update currentStudent signal upon success', () => {
      service.getStudent(studentId).subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpTestingController.expectOne(detailUrl);
      req.flush(mockDetailResponse);

      const current = service.currentStudent();
      expect(current).toBeTruthy();
      expect(current?.studentId).toBe(studentId);
      expect(current?.personal?.fullName).toBe('Ananya Sharma');
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('should handle 404 Not Found error gracefully', () => {
      service.getStudent('STU_NON_EXISTENT').subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(
        `${expectedBaseUrl}/STU_NON_EXISTENT`
      );
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(service.error()).toBe('Student profile not found.');
      expect(service.loading()).toBe(false);
    });

    it('should handle 403 Forbidden error', () => {
      service.getStudent(studentId).subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(detailUrl);
      req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

      expect(service.error()).toBe('Forbidden');
      expect(service.loading()).toBe(false);
    });

    it('should handle 500 Internal Server Error', () => {
      service.getStudent(studentId).subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(detailUrl);
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      expect(service.error()).toBe('Server error');
      expect(service.loading()).toBe(false);
    });
  });
});
