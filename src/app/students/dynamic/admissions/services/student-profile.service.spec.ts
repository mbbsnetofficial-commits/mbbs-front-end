import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import {
  StudentProfileService,
  BackendStudentProfileResponse,
  mapBackendProfileToFrontend,
} from './student-profile.service';
import { environment } from '../../../../../environments/environment';

describe('StudentProfileService', () => {
  let service: StudentProfileService;
  let httpTesting: HttpTestingController;

  const mockBackendResponse: BackendStudentProfileResponse = {
    success: true,
    data: {
      _id: 'student-profile-01',
      studentId: 'STU-12345',
      userId: 'user-01',
      personal: {
        fullName: 'Sanjay Sivakumar',
        firstName: 'Sanjay',
        lastName: 'Sivakumar',
        email: 'sanjay@example.com',
        phoneNumber: '+91 98765 43210',
        dateOfBirth: '2005-04-16',
        gender: 'Male',
        nationality: 'Indian',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        address: '123 Main Road',
        pincode: '600001',
        avatar: 'https://res.cloudinary.com/mbbs/image/upload/v1/avatar.jpg',
      },
      academic: {
        tenthMarks: 470,
        tenthBoard: 'CBSE',
        tenthPassingYear: 2021,
        twelfthMarks: 460,
        boardOfEducation: 'CBSE',
        twelfthPassingYear: 2023,
        pcbAggregate: 92,
        physicsMarks: 90,
        chemistryMarks: 92,
        biologyMarks: 94,
        englishMarks: 88,
        schoolName: 'St. John Senior Secondary School',
      },
      entrance: {
        examType: 'NEET',
        examYear: 2024,
        rollNumber: '4408192041',
        score: 665,
        maximumScore: 720,
        qualified: true,
      },
      preferences: {
        preferredCountries: ['Georgia', 'Russia', 'Uzbekistan'],
        preferredBudgetUsd: 30000,
        targetIntake: 'September 2024',
        instructionMedium: 'English',
        course: 'MBBS',
        specialization: 'General Medicine',
        hostelRequired: true,
      },
      documents: {
        passport: {
          name: 'International Passport',
          documentType: 'passport',
          status: 'Uploaded',
          url: 'https://res.cloudinary.com/mbbs/raw/upload/v1/passport.pdf',
          uploadedAt: '2024-03-01T10:00:00.000Z',
        },
        tenthCertificate: {
          name: 'Class 10th Certificate',
          documentType: 'tenthCertificate',
          status: 'Not Uploaded',
        },
        twelfthMarksheet: {
          name: 'Class 12th PCB Marksheet',
          documentType: 'twelfthMarksheet',
          status: 'Uploaded',
          url: 'https://res.cloudinary.com/mbbs/raw/upload/v1/twelfth.pdf',
          uploadedAt: '2024-03-02T10:00:00.000Z',
        },
        neetScorecard: {
          name: 'NEET Official Scorecard',
          documentType: 'neetScorecard',
          status: 'Not Uploaded',
        },
      },
      visibility: {
        discoverable: true,
        status: 'Active',
        displayText: 'Active — Profile is discoverable by universities.',
      },
      profileCompletion: 85,
      updatedAt: '2024-03-05T12:00:00.000Z',
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

    // Automatic initial profile load
    const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile`);
    expect(req.request.method).toBe('GET');
    req.flush(mockBackendResponse);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('1. GET /student/profile Mapping', () => {
    it('should map Personal Information correctly including gender normalization', () => {
      const p = service.profile().personal;
      expect(p.fullName).toBe('Sanjay Sivakumar');
      expect(p.dob).toBe('2005-04-16');
      expect(p.gender).toBe('MALE');
      expect(p.nationality).toBe('Indian');
      expect(p.email).toBe('sanjay@example.com');
      expect(p.phone).toBe('+91 98765 43210');
      expect(p.city).toBe('Chennai');
      expect(p.state).toBe('Tamil Nadu');
      expect(p.country).toBe('India');
    });

    it('should map Academic Information correctly with pcbAggregate preference', () => {
      const a = service.profile().academic;
      expect(a.schoolName).toBe('St. John Senior Secondary School');
      expect(a.boardName).toBe('CBSE');
      expect(a.tenthYear).toBe(2021);
      expect(a.tenthMarks).toBe(470);
      expect(a.twelfthYear).toBe(2023);
      expect(a.twelfthMarks).toBe(460);
      expect(a.physicsScore).toBe(90);
      expect(a.chemistryScore).toBe(92);
      expect(a.biologyScore).toBe(94);
      expect(a.englishScore).toBe(88);
      expect(a.pcbPercentage).toBe(92);
    });

    it('should map Entrance / NEET information accurately without duplicate exams', () => {
      const exams = service.profile().entranceExams;
      expect(exams.length).toBe(1);
      const neet = exams[0];
      expect(neet.examType).toBe('NEET');
      expect(neet.year).toBe(2024);
      expect(neet.rollNumber).toBe('4408192041');
      expect(neet.score).toBe(665);
      expect(neet.maxScore).toBe(720);
      expect(neet.qualified).toBe(true);
    });

    it('should deduplicate when backend returns both NEET and OTHER for the same exam', () => {
      const duplicateData = {
        entrance: {
          examType: 'NEET',
          examYear: 2024,
          rollNumber: 'NEET2024IN890360',
          score: 620,
          qualified: true,
        },
        entranceExams: [
          {
            examType: 'OTHER',
            examYear: 2024,
            rollNumber: 'NEET2024IN890360',
            score: 620,
            qualified: true,
          },
        ],
      };
      const mapped = mapBackendProfileToFrontend(duplicateData);
      expect(mapped.entranceExams.length).toBe(1);
      expect(mapped.entranceExams[0].examType).toBe('NEET');
      expect(mapped.entranceExams[0].score).toBe(620);
      expect(mapped.entranceExams[0].rollNumber).toBe('NEET2024IN890360');
    });

    it('should map Preferences normalizing single intake string to array', () => {
      const pref = service.profile().preferences;
      expect(pref.preferredCountries).toEqual(['Georgia', 'Russia', 'Uzbekistan']);
      expect(pref.preferredIntake).toEqual(['September 2024']);
      expect(pref.preferredBudgetUsd).toBe(30000);
      expect(pref.preferredLanguage).toBe('English');
      expect(pref.hostelRequired).toBe(true);
    });

    it('should map Documents object to StudentDocument[] with all 4 cards always present', () => {
      const docs = service.profile().documents;
      expect(docs.length).toBe(4);

      const passport = docs.find((d) => d.type === 'PASSPORT');
      expect(passport).toBeDefined();
      expect(passport?.status).toBe('UPLOADED');
      expect(passport?.fileUrl).toBe('https://res.cloudinary.com/mbbs/raw/upload/v1/passport.pdf');

      const tenth = docs.find((d) => d.type === 'TENTH_CERTIFICATE');
      expect(tenth).toBeDefined();
      expect(tenth?.status).toBe('NOT_UPLOADED');

      const twelfth = docs.find((d) => d.type === 'TWELFTH_CERTIFICATE');
      expect(twelfth).toBeDefined();
      expect(twelfth?.status).toBe('UPLOADED');

      const neet = docs.find((d) => d.type === 'NEET_SCORECARD');
      expect(neet).toBeDefined();
      expect(neet?.status).toBe('NOT_UPLOADED');
    });

    it('should map Visibility and Profile Completion from backend', () => {
      const p = service.profile();
      expect(p.isDiscoverable).toBe(true);
      expect(p.discoveryStatusText).toBe('Active — Profile is discoverable by universities.');
      expect(p.completionPercentage).toBe(85);
      expect(p.avatarUrl).toBe('https://res.cloudinary.com/mbbs/image/upload/v1/avatar.jpg');
    });
  });

  describe('2. PUT /student/profile Section Updates', () => {
    it('should save Personal section with exact payload and update state from response', async () => {
      const personalUpdate = {
        fullName: 'Sanjay Sivakumar Jr.',
        dob: '2005-04-16',
        gender: 'MALE' as const,
        nationality: 'Indian',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        country: 'India',
        email: 'sanjay.new@example.com',
        phone: '+91 99999 88888',
      };

      const updatedBackendResponse: BackendStudentProfileResponse = {
        success: true,
        message: 'Profile updated successfully',
        data: {
          ...mockBackendResponse.data,
          personal: {
            ...mockBackendResponse.data.personal,
            fullName: 'Sanjay Sivakumar Jr.',
            city: 'Coimbatore',
            email: 'sanjay.new@example.com',
            phoneNumber: '+91 99999 88888',
          },
          updatedAt: '2024-03-05T15:00:00.000Z',
        },
      };

      const promise = firstValueFrom(service.updatePersonal(personalUpdate));

      const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        fullName: 'Sanjay Sivakumar Jr.',
        dateOfBirth: '2005-04-16',
        gender: 'Male',
        nationality: 'Indian',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        country: 'India',
        email: 'sanjay.new@example.com',
        phone: '+91 99999 88888',
        phoneNumber: '+91 99999 88888',
      });

      req.flush(updatedBackendResponse);
      const updated = await promise;

      expect(updated.personal.fullName).toBe('Sanjay Sivakumar Jr.');
      expect(updated.personal.city).toBe('Coimbatore');
      expect(service.profile().personal.fullName).toBe('Sanjay Sivakumar Jr.');
    });

    it('should save Academic section with exact flat payload and update state from response', async () => {
      const academicUpdate = {
        schoolName: 'National Public School',
        boardName: 'ICSE',
        twelfthYear: 2024,
        physicsScore: 95,
        chemistryScore: 94,
        biologyScore: 98,
        englishScore: 92,
      };

      const updatedBackendResponse: BackendStudentProfileResponse = {
        success: true,
        message: 'Academic details updated',
        data: {
          ...mockBackendResponse.data,
          academic: {
            ...mockBackendResponse.data.academic,
            schoolName: 'National Public School',
            boardOfEducation: 'ICSE',
            twelfthPassingYear: 2024,
            physicsMarks: 95,
            chemistryMarks: 94,
            biologyMarks: 98,
            englishMarks: 92,
            pcbAggregate: 95.67,
          },
        },
      };

      const promise = firstValueFrom(service.updateAcademic(academicUpdate));

      const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        schoolName: 'National Public School',
        boardOfEducation: 'ICSE',
        twelfthBoard: 'ICSE',
        twelfthPassingYear: 2024,
        physicsMarks: 95,
        chemistryMarks: 94,
        biologyMarks: 98,
        englishMarks: 92,
      });

      req.flush(updatedBackendResponse);
      const updated = await promise;

      expect(updated.academic.schoolName).toBe('National Public School');
      expect(updated.academic.boardName).toBe('ICSE');
      expect(service.profile().academic.schoolName).toBe('National Public School');
    });

    it('should save Entrance section with exact NEET payload', async () => {
      const entranceUpdate = [
        {
          id: 'exam-neet',
          examType: 'NEET',
          year: 2024,
          rollNumber: '2401008899',
          score: 680,
          qualified: true,
        },
      ];

      const updatedBackendResponse: BackendStudentProfileResponse = {
        success: true,
        data: {
          ...mockBackendResponse.data,
          entrance: {
            examType: 'NEET',
            examYear: 2024,
            rollNumber: '2401008899',
            score: 680,
            maximumScore: 720,
            qualified: true,
          },
        },
      };

      const promise = firstValueFrom(service.updateEntrance(entranceUpdate));

      const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        examType: 'NEET',
        examYear: 2024,
        rollNumber: '2401008899',
        score: 680,
        qualified: true,
      });

      req.flush(updatedBackendResponse);
      const updated = await promise;

      expect(updated.entranceExams[0].score).toBe(680);
      expect(service.profile().entranceExams[0].score).toBe(680);
    });

    it('should save Preferences section with exact payload', async () => {
      const preferencesUpdate = {
        preferredCountries: ['Georgia', 'Kazakhstan'],
        preferredIntake: ['September 2025'],
        preferredBudgetUsd: 25000,
        preferredLanguage: 'English',
        hostelRequired: true,
      };

      const updatedBackendResponse: BackendStudentProfileResponse = {
        success: true,
        data: {
          ...mockBackendResponse.data,
          preferences: {
            preferredCountries: ['Georgia', 'Kazakhstan'],
            targetIntake: 'September 2025',
            preferredBudgetUsd: 25000,
            instructionMedium: 'English',
            hostelRequired: true,
          },
        },
      };

      const promise = firstValueFrom(service.updatePreferences(preferencesUpdate));

      const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        preferredCountries: ['Georgia', 'Kazakhstan'],
        targetIntake: 'September 2025',
        preferredIntake: 'September 2025',
        preferredBudgetUsd: 25000,
        annualBudget: '25000 USD',
        instructionMedium: 'English',
        preferredLanguage: 'English',
        hostelRequired: true,
      });

      req.flush(updatedBackendResponse);
      const updated = await promise;

      expect(updated.preferences.preferredCountries).toEqual(['Georgia', 'Kazakhstan']);
      expect(service.profile().preferences.preferredCountries).toEqual(['Georgia', 'Kazakhstan']);
    });
  });

  describe('3. PATCH /student/profile/visibility', () => {
    it('should call PATCH with { discoverable: false } and update state', async () => {
      const promise = firstValueFrom(service.updateVisibility(false));

      const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile/visibility`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ discoverable: false });

      req.flush({
        success: true,
        data: {
          discoverable: false,
          status: 'Inactive',
          displayText: 'Inactive — Profile is currently not discoverable by universities.',
        },
      });

      await promise;
      expect(service.profile().isDiscoverable).toBe(false);
      expect(service.profile().discoveryStatusText).toBe(
        'Inactive — Profile is currently not discoverable by universities.'
      );
    });

    it('should not mutate discoverability state on PATCH error', async () => {
      const promise = firstValueFrom(service.updateVisibility(false));

      const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile/visibility`);
      req.flush(
        { success: false, message: 'Server error' },
        { status: 500, statusText: 'Server Error' }
      );

      try {
        await promise;
      } catch (err) {
        expect(err).toBeDefined();
      }

      // State remains unchanged
      expect(service.profile().isDiscoverable).toBe(true);
    });
  });

  describe('4. Document Upload & Delete', () => {
    it('should upload document via POST /student/profile/documents/passport using FormData', async () => {
      const file = new File(['dummy-content'], 'my_passport.pdf', { type: 'application/pdf' });
      const promise = firstValueFrom(service.uploadDocument('PASSPORT', file));

      const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile/documents/passport`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      expect((req.request.body as FormData).get('document')).toBeTruthy();

      req.flush({
        success: true,
        data: {
          id: 'doc-passport-999',
          name: 'International Passport',
          documentType: 'passport',
          status: 'Uploaded',
          url: 'https://res.cloudinary.com/mbbs/raw/upload/v1/new_passport.pdf',
          uploadedAt: '2024-03-05T14:00:00.000Z',
        },
      });

      const doc = await promise;
      expect(doc.type).toBe('PASSPORT');
      expect(doc.status).toBe('UPLOADED');
      expect(doc.fileUrl).toBe('https://res.cloudinary.com/mbbs/raw/upload/v1/new_passport.pdf');

      const passportCard = service.profile().documents.find((d) => d.type === 'PASSPORT');
      expect(passportCard?.fileUrl).toBe('https://res.cloudinary.com/mbbs/raw/upload/v1/new_passport.pdf');
    });

    it('should delete document via DELETE /student/profile/documents/passport and reset card without removing it', async () => {
      const promise = firstValueFrom(service.deleteDocument('PASSPORT'));

      const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile/documents/passport`);
      expect(req.request.method).toBe('DELETE');

      req.flush({
        success: true,
        message: 'Document deleted successfully',
      });

      await promise;

      const docs = service.profile().documents;
      expect(docs.length).toBe(4); // All 4 cards must remain visible
      const passportCard = docs.find((d) => d.type === 'PASSPORT');
      expect(passportCard).toBeDefined();
      expect(passportCard?.status).toBe('NOT_UPLOADED');
      expect(passportCard?.fileUrl).toBe('');
      expect(passportCard?.uploadedAt).toBeUndefined();
    });
  });

  describe('5. Profile Photo Upload', () => {
    it('should upload photo via POST /student/profile/photo using FormData and update avatarUrl', async () => {
      const photoFile = new File(['image-bytes'], 'photo.jpg', { type: 'image/jpeg' });
      const promise = firstValueFrom(service.uploadPhoto(photoFile));

      const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile/photo`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      expect((req.request.body as FormData).get('photo')).toBeTruthy();

      req.flush({
        success: true,
        data: {
          url: 'https://res.cloudinary.com/mbbs/image/upload/v1/brand_new_avatar.jpg',
        },
      });

      const res = await promise;
      expect(res.url).toBe('https://res.cloudinary.com/mbbs/image/upload/v1/brand_new_avatar.jpg');
      expect(service.profile().avatarUrl).toBe(
        'https://res.cloudinary.com/mbbs/image/upload/v1/brand_new_avatar.jpg'
      );
    });
  });

  describe('6. Error Handling', () => {
    it('should not mutate profile state when PUT /student/profile fails', async () => {
      const promise = firstValueFrom(
        service.updatePersonal({ fullName: 'Malicious Update' })
      );

      const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile`);
      req.flush(
        { success: false, message: 'Bad Request' },
        { status: 400, statusText: 'Bad Request' }
      );

      try {
        await promise;
      } catch (err) {
        expect(err).toBeDefined();
      }

      expect(service.error()).toBe('Bad Request');
      expect(service.profile().personal.fullName).toBe('Sanjay Sivakumar'); // Not changed
    });
  });
});
