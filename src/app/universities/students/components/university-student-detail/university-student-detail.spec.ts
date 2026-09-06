import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UniversityInvitesService } from '../../../invites/services/university-invites.service';
import { UniversityStudent } from '../../models/university-student.model';
import { UniversityStudentsService } from '../../services/university-students.service';
import { UniversityTemplatesService } from '../../../templates/services/university-templates.service';
import { UniversityProfileService } from '../../../profile/services/university-profile.service';
import { UniversityAuthService } from '../../../auth/services/university-auth.service';
import { UniversityStudentDetailComponent } from './university-student-detail';

describe('UniversityStudentDetailComponent', () => {
  let component: UniversityStudentDetailComponent;
  let fixture: ComponentFixture<UniversityStudentDetailComponent>;
  let studentsServiceMock: {
    currentStudent: ReturnType<typeof signal<UniversityStudent | null>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    getStudent: ReturnType<typeof vi.fn>;
  };
  let invitesServiceMock: {
    sending: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    sendInvitation: ReturnType<typeof vi.fn>;
  };
  let templatesServiceMock: {
    templates: ReturnType<typeof signal<any[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    getTemplates: ReturnType<typeof vi.fn>;
  };
  let profileServiceMock: {
    profile: ReturnType<typeof signal<any>>;
    loading: ReturnType<typeof signal<boolean>>;
  };
  let authServiceMock: {
    currentUser: ReturnType<typeof signal<any>>;
  };

  const mockTemplates = [
    {
      _id: 'tmpl_101',
      name: 'Direct MBBS Offer Template',
      subject: 'Official Admission Offer: MBBS for {{student_name}}',
      message:
        'Dear {{student_name}} (ID: {{student_id}}), {{university_name}} offers you admission into {{course}} for the {{intake}} session at fee {{tuition_fee}}.',
    },
    {
      _id: 'tmpl_102',
      name: 'Merit Scholarship Offer',
      subject: 'Merit Scholarship Offer for {{student_name}}',
      message: 'Hello {{student_name}}, congratulations on your NEET score!',
    },
  ];

  const mockStudentDetail: UniversityStudent = {
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
  };

  beforeEach(async () => {
    studentsServiceMock = {
      currentStudent: signal<UniversityStudent | null>(mockStudentDetail),
      loading: signal(false),
      error: signal<string | null>(null),
      getStudent: vi.fn().mockReturnValue(
        of({
          success: true,
          data: mockStudentDetail,
        })
      ),
    };

    invitesServiceMock = {
      sending: signal(false),
      error: signal<string | null>(null),
      sendInvitation: vi.fn().mockReturnValue(
        of({
          success: true,
          message: 'Invitation sent successfully',
          data: {
            _id: '67b36f1c4e9b8a0012345999',
            studentId: 'STU17869056359535Q01Q3',
            subject: 'Direct MBBS Admission Offer',
            status: 'PENDING',
            createdAt: '2026-08-21T08:00:00.000Z',
          },
        })
      ),
    };

    templatesServiceMock = {
      templates: signal(mockTemplates),
      loading: signal(false),
      getTemplates: vi.fn().mockReturnValue(
        of({
          success: true,
          data: {
            items: mockTemplates,
            pagination: { page: 1, limit: 50, total: 2, totalPages: 1 },
          },
        })
      ),
    };

    profileServiceMock = {
      profile: signal({
        name: 'Tbilisi State Medical University',
        country: 'Georgia',
      }),
      loading: signal(false),
    };

    authServiceMock = {
      currentUser: signal({
        name: 'Tbilisi State Medical University',
      }),
    };

    await TestBed.configureTestingModule({
      imports: [UniversityStudentDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) =>
                  key === 'studentId' ? 'STU17869056359535Q01Q3' : null,
              },
            },
            paramMap: of({
              get: (key: string) =>
                key === 'studentId' ? 'STU17869056359535Q01Q3' : null,
            }),
          },
        },
        { provide: UniversityStudentsService, useValue: studentsServiceMock },
        { provide: UniversityInvitesService, useValue: invitesServiceMock },
        { provide: UniversityTemplatesService, useValue: templatesServiceMock },
        { provide: UniversityProfileService, useValue: profileServiceMock },
        { provide: UniversityAuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UniversityStudentDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }, 30000);

  it('should create UniversityStudentDetailComponent and load profile on init', () => {
    expect(component).toBeTruthy();
    expect(studentsServiceMock.getStudent).toHaveBeenCalledWith(
      'STU17869056359535Q01Q3'
    );
  });

  it('should render student identity, name, ID, and location', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const nameEl = compiled.querySelector('.student-full-name');
    const idPill = compiled.querySelector('.student-id-pill');
    const locationEl = compiled.querySelector('.student-location');
    const completionEl = compiled.querySelector('.completion-value');

    expect(nameEl?.textContent).toContain('Ananya Sharma');
    expect(idPill?.textContent).toContain('STU17869056359535Q01Q3');
    expect(locationEl?.textContent).toContain('Delhi, India');
    expect(completionEl?.textContent).toContain('100%');
  });

  it('should render entrance exam details accurately', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const neetScore = compiled.querySelector('.highlight-score');
    const qualifiedTag = compiled.querySelector('.status-tag.qualified');

    expect(neetScore?.textContent).toContain('610');
    expect(qualifiedTag?.textContent).toContain('Qualified');
  });

  it('should render academic record details accurately', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const pcbPercentage = compiled.querySelector('.highlight-green');
    const boardEl = compiled.textContent;

    expect(pcbPercentage?.textContent).toContain('94%');
    expect(boardEl).toContain('CBSE');
    expect(boardEl).toContain('Delhi Public School');
  });

  it('should render preferences with formatted budget and preferred countries', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const budgetEl = compiled.querySelector('.highlight-amber');
    const text = compiled.textContent;

    expect(budgetEl?.textContent).toContain('$25,000 USD');
    expect(text).toContain('Georgia, Russia');
    expect(text).toContain('September');
  });

  it('should render clean empty state when no student profile is found', () => {
    studentsServiceMock.currentStudent.set(null);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emptyState = compiled.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('Student Profile Unavailable');
  });

  it('should render error alert and trigger retry on button click', () => {
    studentsServiceMock.currentStudent.set(null);
    studentsServiceMock.error.set('Student profile not found.');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const errorAlert = compiled.querySelector('.alert-card.error');
    expect(errorAlert).toBeTruthy();
    expect(errorAlert?.textContent).toContain('Student profile not found.');

    const retryBtn = compiled.querySelector('.btn-retry') as HTMLButtonElement;
    expect(retryBtn).toBeTruthy();

    retryBtn.click();
    expect(studentsServiceMock.getStudent).toHaveBeenCalledTimes(2);
  });

  it('should render back link to Candidate Students (/university/students)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const backLink = compiled.querySelector('a.back-link');
    expect(backLink?.getAttribute('href')).toBe('/university/students');
  });

  describe('API #8: Send Admission Offer Flow', () => {
    it('should open the offer modal when clicking Send Admission Offer button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const sendBtn = compiled.querySelector('.btn-send-offer') as HTMLButtonElement;
      expect(sendBtn).toBeTruthy();

      sendBtn.click();
      fixture.detectChanges();

      expect(component.showOfferModal()).toBe(true);
      const modal = compiled.querySelector('.modal-card');
      expect(modal).toBeTruthy();
      expect(modal?.textContent).toContain('Issue Admission Offer');
      expect(modal?.textContent).toContain('STU17869056359535Q01Q3');
    });

    it('should call invitesService.sendInvitation with payload and show success notification upon submission', () => {
      component.openOfferModal();
      fixture.detectChanges();

      component.offerSubject = 'Official Direct MBBS Offer';
      component.offerCourse = 'MBBS';
      component.offerTuition = 25000;
      component.offerIntake = 'September 2026';
      component.offerMessage = 'Welcome to our program.';

      component.submitOffer();

      expect(invitesServiceMock.sendInvitation).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 'STU17869056359535Q01Q3',
          subject: 'Official Direct MBBS Offer',
          course: 'MBBS',
          tuitionFeeUsd: 25000,
          intake: 'September 2026',
          message: 'Welcome to our program.',
        })
      );

      expect(component.showOfferModal()).toBe(false);
      expect(component.offerSuccessMessage()).toContain('successfully dispatched');
    });

    it('should display error message and keep modal open if sendInvitation fails with generic error', () => {
      invitesServiceMock.sendInvitation.mockReturnValue(
        throwError(() => ({
          error: { message: 'Internal server error processing request.' },
          status: 500,
        }))
      );

      component.openOfferModal();
      fixture.detectChanges();

      component.submitOffer();

      expect(invitesServiceMock.sendInvitation).toHaveBeenCalled();
      expect(component.showOfferModal()).toBe(true);
      expect(component.offerErrorMessage()).toBe(
        'Internal server error processing request.'
      );
      expect(component.showDuplicateInvitePopup()).toBe(false);
    });

    it('should open duplicate invite pop-up dialog and NOT show inline modal error when active invitation exists', () => {
      invitesServiceMock.sendInvitation.mockReturnValue(
        throwError(() => ({
          error: {
            message:
              "An active invitation already exists for this student. You cannot send duplicate active invitations. Pass 'resend: true' to supersede the existing invite.",
            error: { code: 'ACTIVE_INVITE_EXISTS' },
          },
          status: 409,
        }))
      );

      component.openOfferModal();
      fixture.detectChanges();

      component.submitOffer();
      fixture.detectChanges();

      expect(invitesServiceMock.sendInvitation).toHaveBeenCalled();
      expect(component.offerErrorMessage()).toBeNull();
      expect(component.showDuplicateInvitePopup()).toBe(true);

      const compiled = fixture.nativeElement as HTMLElement;
      const popup = compiled.querySelector('.duplicate-popup-card');
      expect(popup).toBeTruthy();
      expect(popup?.textContent).toContain('Active Invitation Already Exists');
      expect(popup?.textContent).toContain('You cannot send duplicate active invitations');
    });

    it('should close duplicate pop-up when clicking Keep Existing button', () => {
      component.openOfferModal();
      component.showDuplicateInvitePopup.set(true);
      fixture.detectChanges();

      component.closeDuplicatePopup();
      fixture.detectChanges();

      expect(component.showDuplicateInvitePopup()).toBe(false);
    });

    it('should call sendInvitation with resend: true and show success when clicking Resend & Replace Offer', () => {
      invitesServiceMock.sendInvitation.mockReturnValue(
        of({
          success: true,
          message: 'Invitation sent successfully',
          data: {
            _id: 'INV_RESENT_123',
            studentId: 'STU17869056359535Q01Q3',
            subject: 'Official Direct MBBS Offer',
            status: 'PENDING',
            createdAt: '2026-08-21T08:00:00.000Z',
          },
        })
      );

      component.openOfferModal();
      component.showDuplicateInvitePopup.set(true);
      fixture.detectChanges();

      component.confirmResendOffer();
      fixture.detectChanges();

      expect(invitesServiceMock.sendInvitation).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 'STU17869056359535Q01Q3',
          resend: true,
        })
      );
      expect(component.showDuplicateInvitePopup()).toBe(false);
      expect(component.showOfferModal()).toBe(false);
      expect(component.offerSuccessMessage()).toContain('successfully updated and resent');
    });

    it('should close modal when clicking Cancel button without submitting', () => {
      component.openOfferModal();
      fixture.detectChanges();

      component.closeOfferModal();
      fixture.detectChanges();

      expect(component.showOfferModal()).toBe(false);
      expect(invitesServiceMock.sendInvitation).not.toHaveBeenCalled();
    });
  });

  describe('University Templates Selection and Tag Replacement', () => {
    it('should call templatesService.getTemplates when opening offer modal', () => {
      component.openOfferModal();
      expect(templatesServiceMock.getTemplates).toHaveBeenCalledWith(1, 50);
      expect(component.showOfferModal()).toBe(true);
    });

    it('should populate subject and message with resolved dynamic tags when template is selected', () => {
      component.openOfferModal();
      component.onTemplateChange('tmpl_101');
      fixture.detectChanges();

      expect(component.selectedTemplateId()).toBe('tmpl_101');
      expect(component.appliedTemplateName()).toBe('Direct MBBS Offer Template');
      expect(component.offerSubject).toBe(
        'Official Admission Offer: MBBS for Ananya Sharma'
      );
      expect(component.offerMessage).toContain(
        'Dear Ananya Sharma (ID: STU17869056359535Q01Q3)'
      );
      expect(component.offerMessage).toContain('Tbilisi State Medical University');
      expect(component.offerMessage).toContain('MBBS');
      expect(component.offerMessage).toContain('September');
      expect(component.offerMessage).toContain('$25,000');
    });

    it('should reset to default subject and message when selecting empty template option', () => {
      component.openOfferModal();
      component.onTemplateChange('tmpl_101');
      expect(component.selectedTemplateId()).toBe('tmpl_101');

      component.onTemplateChange('');
      expect(component.selectedTemplateId()).toBe('');
      expect(component.appliedTemplateName()).toBe('');
      expect(component.offerSubject).toBe('Direct MBBS Admission Offer');
      expect(component.offerMessage).toBe('');
    });

    it('should reset to original template text when clicking resetToTemplateDefaults', () => {
      component.openOfferModal();
      component.onTemplateChange('tmpl_102');
      component.offerSubject = 'Edited Subject by staff';
      component.offerMessage = 'Edited message body';

      component.resetToTemplateDefaults();

      expect(component.offerSubject).toBe(
        'Merit Scholarship Offer for Ananya Sharma'
      );
      expect(component.offerMessage).toBe(
        'Hello Ananya Sharma, congratulations on your NEET score!'
      );
    });

    it('should insert dynamic tag when calling insertPlaceholder', () => {
      component.openOfferModal();
      component.offerMessage = 'Welcome to campus';
      component.insertPlaceholder('{{student_name}}');

      expect(component.offerMessage).toBe('Welcome to campus Ananya Sharma');
    });

    it('should dispatch invitation with templateId when template is selected', () => {
      component.openOfferModal();
      component.onTemplateChange('tmpl_101');
      component.submitOffer();

      expect(invitesServiceMock.sendInvitation).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 'STU17869056359535Q01Q3',
          templateId: 'tmpl_101',
          subject: 'Official Admission Offer: MBBS for Ananya Sharma',
        })
      );
    });
  });
});
