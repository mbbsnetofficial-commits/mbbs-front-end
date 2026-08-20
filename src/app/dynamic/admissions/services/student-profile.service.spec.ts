import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { StudentProfileService, BackendStudentProfileResponse } from './student-profile.service';
import { environment } from '../../../../environments/environment';

describe('StudentProfileService', () => {
  let service: StudentProfileService;
  let httpTesting: HttpTestingController;

  const mockBackendResponse: BackendStudentProfileResponse = {
    success: true,
    data: {
      _id: 'student-profile-01',
      userId: 'user-01',
      personal: {
        fullName: 'Sanjay Sivakumar',
        firstName: 'Sanjay',
        lastName: 'Sivakumar',
        email: 'sanjay@example.com',
        phoneNumber: '+91 98765 43210',
        dateOfBirth: '2005-04-16',
        gender: 'MALE',
        nationality: 'Indian',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        address: '123 Main Road',
        pincode: '600001',
        avatar: '/images/profile.jpg',
      },
      academic: {
        tenthMarks: 470,
        tenthBoard: 'CBSE',
        tenthPassingYear: 2021,
        twelfthMarks: 460,
        twelfthBoard: 'CBSE',
        twelfthPassingYear: 2023,
        pcbPercentage: 92,
        physicsMarks: 90,
        chemistryMarks: 92,
        biologyMarks: 94,
        englishMarks: 88,
        schoolName: 'St. John’s Senior Secondary School',
      },
      entrance: {
        neetScore: 580,
        neetRollNumber: '4408192041',
        neetYear: 2025,
        neetQualified: true,
        ucatScore: null,
        otherExams: [],
      },
      preferences: {
        preferredCountries: ['Georgia', 'Russia', 'Uzbekistan'],
        preferredBudgetUsd: 30000,
        preferredIntake: 'September',
        preferredLanguage: 'English',
        course: 'MBBS',
        specialization: 'General Medicine',
      },
      profileCompletion: 100,
      isDiscoverable: true,
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        StudentProfileService,
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
    service = TestBed.inject(StudentProfileService);

    const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile`);
    expect(req.request.method).toBe('GET');
    req.flush(mockBackendResponse);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should accurately map academic marks without converting to fake percentages', () => {
    const p = service.profile();
    expect(p.academic.tenthMarks).toBe(470);
    expect(p.academic.twelfthMarks).toBe(460);
    expect(p.academic.tenthPercentage).toBeUndefined();
    expect(p.academic.overallPercentage).toBeUndefined();
    expect(p.academic.pcbPercentage).toBe(92);
    expect(p.academic.physicsScore).toBe(90);
    expect(p.academic.chemistryScore).toBe(92);
    expect(p.academic.biologyScore).toBe(94);
    expect(p.academic.englishScore).toBe(88);
  });

  it('should map NEET exam fields without fabricating nonexistent rank or percentile', () => {
    const p = service.profile();
    expect(p.entranceExams.length).toBe(1);
    const neet = p.entranceExams[0];
    expect(neet.score).toBe(580);
    expect(neet.rollNumber).toBe('4408192041');
    expect(neet.year).toBe(2025);
    expect(neet.qualified).toBe(true);
    // Explicitly verify nonexistent backend fields are NOT fabricated
    expect(neet.rank).toBeUndefined();
    expect(neet.percentile).toBeUndefined();
  });

  it('should accurately map USD budget and preferences', () => {
    const p = service.profile();
    expect(p.preferences.preferredCountries).toEqual(['Georgia', 'Russia', 'Uzbekistan']);
    expect(p.preferences.preferredBudgetUsd).toBe(30000);
    expect(p.preferences.currency).toBe('USD');
    expect(p.preferences.preferredIntake).toEqual(['September']);
    expect(p.preferences.preferredLanguage).toBe('English');
    expect(p.preferences.preferredCourse).toBe('MBBS (General Medicine)');
  });

  it('should map profile completion directly from backend contract', () => {
    const p = service.profile();
    expect(p.completionPercentage).toBe(100);
  });

  it('should update personal information on local user edit', () => {
    service.updatePersonal({ fullName: 'Sanjay S. Sivakumar' });
    expect(service.profile().personal.fullName).toBe('Sanjay S. Sivakumar');
  });

  it('should toggle discoverability', () => {
    const initial = service.profile().isDiscoverable;
    service.toggleDiscoverability();
    expect(service.profile().isDiscoverable).toBe(!initial);
  });

  it('should upload a document and add it to profile', async () => {
    const doc = await firstValueFrom(
      service.uploadDocument('MEDICAL_CERTIFICATE', { name: 'health_fit.pdf', size: '1.1 MB' })
    );
    expect(doc.type).toBe('MEDICAL_CERTIFICATE');
    expect(doc.status).toBe('UPLOADED');
  });

  describe('createProfile API (POST /student/profile)', () => {
    const newProfilePayload = {
      personal: {
        fullName: 'Rahul Sharma',
        firstName: 'Rahul',
        lastName: 'Sharma',
        email: 'rahul@example.com',
        phoneNumber: '+91 91234 56789',
        dateOfBirth: '2006-02-20',
        gender: 'MALE',
        nationality: 'Indian',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
      },
      academic: {
        tenthMarks: 480,
        tenthBoard: 'CBSE',
        tenthPassingYear: 2022,
        twelfthMarks: 470,
        twelfthBoard: 'CBSE',
        twelfthPassingYear: 2024,
        pcbPercentage: 94,
        physicsMarks: 92,
        chemistryMarks: 94,
        biologyMarks: 96,
        englishMarks: 90,
        schoolName: 'Delhi Public School',
      },
      entrance: {
        neetScore: 620,
        neetRollNumber: '8899001122',
        neetYear: 2026,
        neetQualified: true,
        ucatScore: null,
      },
      preferences: {
        preferredCountries: ['Russia', 'Kazakhstan'],
        preferredBudgetUsd: 25000,
        preferredIntake: 'September 2026',
        preferredLanguage: 'English',
        course: 'MBBS',
        specialization: 'General Medicine',
      },
    };

    it('should call POST /student/profile with payload and update state upon success', async () => {
      const createdBackendResponse: BackendStudentProfileResponse = {
        success: true,
        message: 'Student profile created successfully',
        data: {
          _id: 'student-profile-new-99',
          userId: 'user-99',
          ...newProfilePayload,
          profileCompletion: 85,
          isDiscoverable: true,
          updatedAt: '2026-08-20T17:00:00.000Z',
        },
      };

      const promise = firstValueFrom(service.createProfile(newProfilePayload));
      const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newProfilePayload);
      req.flush(createdBackendResponse);

      const created = await promise;
      expect(created.id).toBe('student-profile-new-99');
      expect(created.personal.fullName).toBe('Rahul Sharma');
      expect(created.academic.pcbPercentage).toBe(94);
      expect(created.entranceExams[0].score).toBe(620);
      expect(service.profile().id).toBe('student-profile-new-99');
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('should handle 400 Bad Request error without mutating profile state', async () => {
      const promise = firstValueFrom(service.createProfile(newProfilePayload));
      const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile`);
      req.flush(
        { success: false, message: 'Invalid profile data provided' },
        { status: 400, statusText: 'Bad Request' }
      );

      try {
        await promise;
      } catch (err: any) {
        expect(err.status).toBe(400);
      }

      expect(service.error()).toBe('Invalid profile data provided');
      expect(service.loading()).toBe(false);
      expect(service.profile().id).toBe('student-profile-01'); // Previous state preserved
    });

    it('should handle 401 Unauthorized error during profile creation', async () => {
      const promise = firstValueFrom(service.createProfile(newProfilePayload));
      const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile`);
      req.flush(
        { success: false, message: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' }
      );

      try {
        await promise;
      } catch (err: any) {
        expect(err.status).toBe(401);
      }

      expect(service.error()).toBe('Unauthorized');
    });

    it('should handle 409 Conflict error when profile already exists', async () => {
      const promise = firstValueFrom(service.createProfile(newProfilePayload));
      const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile`);
      req.flush(
        { success: false, message: 'Student profile already exists' },
        { status: 409, statusText: 'Conflict' }
      );

      try {
        await promise;
      } catch (err: any) {
        expect(err.status).toBe(409);
      }

      expect(service.error()).toBe('Student profile already exists');
    });

    it('should handle 422 Validation Error during profile creation', async () => {
      const promise = firstValueFrom(service.createProfile(newProfilePayload));
      const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile`);
      req.flush(
        { success: false, message: 'Validation failed: Invalid email format' },
        { status: 422, statusText: 'Unprocessable Entity' }
      );

      try {
        await promise;
      } catch (err: any) {
        expect(err.status).toBe(422);
      }

      expect(service.error()).toBe('Validation failed: Invalid email format');
    });

    it('should handle 500 Server Error during profile creation', async () => {
      const promise = firstValueFrom(service.createProfile(newProfilePayload));
      const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile`);
      req.flush(
        { success: false, message: 'Internal Server Error' },
        { status: 500, statusText: 'Server Error' }
      );

      try {
        await promise;
      } catch (err: any) {
        expect(err.status).toBe(500);
      }

      expect(service.error()).toBe('Internal Server Error');
    });
  });
});
