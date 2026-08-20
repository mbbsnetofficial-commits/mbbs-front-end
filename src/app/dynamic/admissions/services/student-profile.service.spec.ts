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
});
