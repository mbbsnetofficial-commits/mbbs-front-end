import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { UniversityAuthService } from '../../auth/services/university-auth.service';
import {
  UniversityProfile,
  UniversityProfileResponse,
  UpdateUniversityProfileRequest,
  UpdateUniversityProfileResponse,
} from '../models/university-profile.model';
import { UniversityProfileService } from './university-profile.service';

describe('UniversityProfileService', () => {
  let service: UniversityProfileService;
  let httpTestingController: HttpTestingController;
  let authServiceMock: { getToken: ReturnType<typeof vi.fn> };

  const baseUrl = environment.universityApiBaseUrl;
  const profileUrl = `${baseUrl}/organization/profile`;

  const mockProfile: UniversityProfile = {
    organizationId: 'ORG_TSMU_001',
    name: 'Tbilisi State Medical University',
    code: 'TSMU',
    country: 'Georgia',
    city: 'Tbilisi',
    logo: 'https://example.com/tsmu-logo.png',
    description:
      'Leading state medical university in Georgia offering WHO-recognized English MD programs.',
    website: 'https://tsmu.edu',
    contactEmail: 'admissions@tsmu.edu',
    contactPhone: '+995322542488',
    address: '33 Vazha-Pshavela Ave, Tbilisi 0186, Georgia',
    accreditations: ['WHO', 'WFME', 'NMC', 'FAIMER', 'ECFMG'],
    worldRanking: 450,
    tuitionFeeMinUsd: 6000,
    tuitionFeeMaxUsd: 8000,
  };

  const mockProfileResponse: UniversityProfileResponse = {
    success: true,
    message: 'Profile retrieved successfully',
    data: mockProfile,
  };

  const mockUpdateRequest: UpdateUniversityProfileRequest = {
    name: 'Tbilisi State Medical University',
    country: 'Georgia',
    city: 'Tbilisi',
    description:
      'Leading state medical university in Georgia offering WHO-recognized English MD programs.',
    website: 'https://tsmu.edu',
    contactEmail: 'admissions@tsmu.edu',
    contactPhone: '+995322542488',
    tuitionFeeMinUsd: 6000,
    tuitionFeeMaxUsd: 8000,
    accreditations: ['WHO', 'WFME', 'NMC', 'FAIMER', 'ECFMG'],
  };

  const mockUpdateResponse: UpdateUniversityProfileResponse = {
    success: true,
    message: 'Organization profile updated successfully',
    data: {
      ...mockProfile,
      name: 'Tbilisi State Medical University (Updated)',
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
        UniversityProfileService,
        { provide: UniversityAuthService, useValue: authServiceMock },
      ],
    });

    service = TestBed.inject(UniversityProfileService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create UniversityProfileService with initial signals state', () => {
    expect(service).toBeTruthy();
    expect(service.loading()).toBe(false);
    expect(service.updating()).toBe(false);
    expect(service.error()).toBeNull();
    expect(service.profile()).toBeNull();
  });

  describe('API #17: getProfile', () => {
    it('1. should call GET /organization/profile with Bearer token', () => {
      service.getProfile().subscribe();

      const req = httpTestingController.expectOne(profileUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-university-token'
      );

      req.flush(mockProfileResponse);
    });

    it('2. should map response data to profile signal', () => {
      service.getProfile().subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res.data.name).toBe('Tbilisi State Medical University');
      });

      const req = httpTestingController.expectOne(profileUrl);
      req.flush(mockProfileResponse);

      expect(service.profile()).toEqual(mockProfile);
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('3. should toggle loading signal during request lifecycle', () => {
      expect(service.loading()).toBe(false);

      service.getProfile().subscribe();
      expect(service.loading()).toBe(true);

      const req = httpTestingController.expectOne(profileUrl);
      req.flush(mockProfileResponse);

      expect(service.loading()).toBe(false);
    });

    it('4. should handle 401 Unauthorized error', () => {
      service.getProfile().subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(profileUrl);
      req.flush({ message: 'Token missing.' }, {
        status: 401,
        statusText: 'Unauthorized',
      });

      expect(service.error()).toBe('Token missing.');
      expect(service.loading()).toBe(false);
    });

    it('5. should handle 403 Forbidden error', () => {
      service.getProfile().subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(profileUrl);
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(service.error()).toBe(
        'Access denied. You do not have permission to view or edit the organization profile.'
      );
      expect(service.loading()).toBe(false);
    });

    it('6. should handle 404 Not Found error', () => {
      service.getProfile().subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(profileUrl);
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(service.error()).toBe('Organization profile not found.');
      expect(service.loading()).toBe(false);
    });

    it('7. should handle 500 Server Error', () => {
      service.getProfile().subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(profileUrl);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(service.error()).toBe(
        'Internal server error while processing profile request. Please try again.'
      );
      expect(service.loading()).toBe(false);
    });
  });

  describe('API #18: updateProfile', () => {
    it('1. should call PUT /organization/profile with exact payload and Bearer token', () => {
      service.updateProfile(mockUpdateRequest).subscribe();

      const req = httpTestingController.expectOne(profileUrl);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockUpdateRequest);
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-university-token'
      );

      req.flush(mockUpdateResponse);
    });

    it('2. should map updated profile to profile signal upon success', () => {
      service.updateProfile(mockUpdateRequest).subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpTestingController.expectOne(profileUrl);
      req.flush(mockUpdateResponse);

      expect(service.profile()?.name).toBe(
        'Tbilisi State Medical University (Updated)'
      );
      expect(service.updating()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('3. should toggle updating signal during update lifecycle', () => {
      expect(service.updating()).toBe(false);

      service.updateProfile(mockUpdateRequest).subscribe();
      expect(service.updating()).toBe(true);

      const req = httpTestingController.expectOne(profileUrl);
      req.flush(mockUpdateResponse);

      expect(service.updating()).toBe(false);
    });

    it('4. should handle 400 Bad Request error', () => {
      service.updateProfile(mockUpdateRequest).subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(profileUrl);
      req.flush(null, { status: 400, statusText: 'Bad Request' });

      expect(service.error()).toBe(
        'Bad request. Please verify all profile fields.'
      );
      expect(service.updating()).toBe(false);
    });

    it('5. should handle 401 Unauthorized error', () => {
      service.updateProfile(mockUpdateRequest).subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(profileUrl);
      req.flush({ message: 'Session expired.' }, {
        status: 401,
        statusText: 'Unauthorized',
      });

      expect(service.error()).toBe('Session expired.');
      expect(service.updating()).toBe(false);
    });

    it('6. should handle 500 Server Error', () => {
      service.updateProfile(mockUpdateRequest).subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(profileUrl);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(service.error()).toBe(
        'Internal server error while processing profile request. Please try again.'
      );
      expect(service.updating()).toBe(false);
    });
  });
});
