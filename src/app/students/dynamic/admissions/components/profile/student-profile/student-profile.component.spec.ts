import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { StudentProfileComponent } from './student-profile.component';
import { StudentProfileService } from '../../../services/student-profile.service';
import { environment } from '../../../../../../../environments/environment';

describe('StudentProfileComponent', () => {
  let component: StudentProfileComponent;
  let fixture: ComponentFixture<StudentProfileComponent>;
  let httpTesting: HttpTestingController;
  let profileService: StudentProfileService;

  const mockProfileResponse = {
    success: true,
    data: {
      _id: 'prof-test-01',
      studentId: 'STU-999',
      personal: {
        fullName: 'Jane Doe',
        dateOfBirth: '2005-01-15',
        gender: 'Female',
        nationality: 'Indian',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        email: 'jane@example.com',
        phoneNumber: '+91 98888 77777',
      },
      academic: {
        schoolName: 'Delhi Public School',
        boardOfEducation: 'CBSE',
        twelfthPassingYear: 2023,
        tenthPassingYear: 2021,
        tenthMarks: 490,
        twelfthMarks: 480,
        physicsMarks: 95,
        chemistryMarks: 96,
        biologyMarks: 98,
        englishMarks: 91,
        pcbAggregate: 96.33,
      },
      entrance: {
        examType: 'NEET',
        examYear: 2024,
        rollNumber: '2409999999',
        score: 690,
        maximumScore: 720,
        qualified: true,
      },
      preferences: {
        preferredCountries: ['Georgia', 'Russia'],
        targetIntake: 'September 2024',
        preferredBudgetUsd: 28000,
        instructionMedium: 'English',
        hostelRequired: true,
      },
      documents: {
        passport: {
          name: 'International Passport',
          documentType: 'passport',
          status: 'Uploaded',
          url: 'https://res.cloudinary.com/mbbs/raw/upload/v1/passport.pdf',
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
        },
        neetScorecard: {
          name: 'NEET Official Scorecard',
          documentType: 'neetScorecard',
          status: 'Not Uploaded',
        },
      },
      visibility: {
        discoverable: true,
        displayText: 'Active — Profile is discoverable by universities.',
      },
      profileCompletion: 90,
      avatar: 'https://res.cloudinary.com/mbbs/image/upload/v1/avatar.jpg',
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentProfileComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        StudentProfileService,
      ],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    profileService = TestBed.inject(StudentProfileService);

    // Flush initial profile load
    const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile`);
    req.flush(mockProfileResponse);

    fixture = TestBed.createComponent(StudentProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should initialize with mapped profile data', () => {
    expect(component).toBeTruthy();
    expect(component.profile().personal.fullName).toBe('Jane Doe');
    expect(component.profile().academic.schoolName).toBe('Delhi Public School');
    expect(component.profile().entranceExams[0].score).toBe(690);
    expect(component.profile().completionPercentage).toBe(90);
    expect(component.profile().isDiscoverable).toBe(true);
  });

  it('should getDocumentByType correctly distinguishing uploaded and unuploaded documents', () => {
    const passport = component.getDocumentByType('PASSPORT');
    expect(passport).toBeDefined();
    expect(passport?.status).toBe('UPLOADED');

    const tenth = component.getDocumentByType('TENTH_CERTIFICATE');
    expect(tenth).toBeUndefined(); // Returns undefined for unuploaded to preserve card template logic
  });

  it('should handle Personal edit and save flow with PUT API', () => {
    component.startEditPersonal();
    expect(component.editingPersonal()).toBe(true);

    component.personalDraft.fullName = 'Jane Doe Updated';
    component.savePersonal();
    expect(component.isSavingPersonal()).toBe(true);

    const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.fullName).toBe('Jane Doe Updated');

    req.flush({
      success: true,
      data: {
        ...mockProfileResponse.data,
        personal: {
          ...mockProfileResponse.data.personal,
          fullName: 'Jane Doe Updated',
        },
      },
    });

    expect(component.isSavingPersonal()).toBe(false);
    expect(component.editingPersonal()).toBe(false);
    expect(component.profile().personal.fullName).toBe('Jane Doe Updated');
    expect(component.showSuccessToast()).toBe('Personal details updated successfully.');
  });

  it('should handle Academic edit and save flow with PUT API', () => {
    component.startEditAcademic();
    expect(component.editingAcademic()).toBe(true);

    component.academicDraft.schoolName = 'Updated High School';
    component.saveAcademic();
    expect(component.isSavingAcademic()).toBe(true);

    const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.schoolName).toBe('Updated High School');

    req.flush({
      success: true,
      data: {
        ...mockProfileResponse.data,
        academic: {
          ...mockProfileResponse.data.academic,
          schoolName: 'Updated High School',
        },
      },
    });

    expect(component.isSavingAcademic()).toBe(false);
    expect(component.editingAcademic()).toBe(false);
    expect(component.profile().academic.schoolName).toBe('Updated High School');
  });

  it('should toggle discoverability via PATCH API', () => {
    component.onToggleDiscoverability();

    const req = httpTesting.expectOne(`${environment.admissionsApiBaseUrl}/student/profile/visibility`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ discoverable: false });

    req.flush({
      success: true,
      data: {
        discoverable: false,
        displayText: 'Inactive — Profile is currently not discoverable by universities.',
      },
    });

    expect(component.profile().isDiscoverable).toBe(false);
    expect(component.showSuccessToast()).toBe('University Discovery paused.');
  });

  it('should reject documents exceeding 10 MB without calling API', () => {
    const hugeFile = new File([''], 'huge.pdf', { type: 'application/pdf' });
    Object.defineProperty(hugeFile, 'size', { value: 11 * 1024 * 1024 });

    const event = { target: { files: [hugeFile], value: 'huge.pdf' } } as unknown as Event;
    component.onFileUpload(event, 'PASSPORT');

    httpTesting.expectNone(`${environment.admissionsApiBaseUrl}/student/profile/documents/passport`);
    expect(component.showSuccessToast()).toBe('File is too large. Maximum allowed size is 10 MB.');
  });

  it('should upload valid document via POST API', () => {
    const validFile = new File(['dummy content'], 'scorecard.pdf', { type: 'application/pdf' });
    const event = { target: { files: [validFile], value: 'scorecard.pdf' } } as unknown as Event;

    component.onFileUpload(event, 'NEET_SCORECARD');
    expect(component.isUploadingDocument()).toBe('NEET_SCORECARD');

    const req = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/profile/documents/neetScorecard`
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);

    req.flush({
      success: true,
      data: {
        name: 'NEET Official Scorecard',
        documentType: 'neetScorecard',
        status: 'Uploaded',
        url: 'https://res.cloudinary.com/mbbs/raw/upload/v1/neet_scorecard.pdf',
      },
    });

    expect(component.isUploadingDocument()).toBeNull();
    const doc = component.getDocumentByType('NEET_SCORECARD');
    expect(doc).toBeDefined();
    expect(doc?.status).toBe('UPLOADED');
  });

  it('should remove document via DELETE API', () => {
    component.removeDocument('PASSPORT');
    expect(component.isDeletingDocument()).toBe('PASSPORT');

    const req = httpTesting.expectOne(
      `${environment.admissionsApiBaseUrl}/student/profile/documents/passport`
    );
    expect(req.request.method).toBe('DELETE');

    req.flush({ success: true });

    expect(component.isDeletingDocument()).toBeNull();
    expect(component.getDocumentByType('PASSPORT')).toBeUndefined();
    expect(component.showSuccessToast()).toBe('Document removed.');
  });
});
