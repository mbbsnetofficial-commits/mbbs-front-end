import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UniversityInvitesService } from '../../../invites/services/university-invites.service';
import { UniversityStudent } from '../../models/university-student.model';
import { UniversityStudentsService } from '../../services/university-students.service';
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

      expect(invitesServiceMock.sendInvitation).toHaveBeenCalledWith({
        studentId: 'STU17869056359535Q01Q3',
        subject: 'Official Direct MBBS Offer',
        course: 'MBBS',
        tuitionFeeUsd: 25000,
        intake: 'September 2026',
        message: 'Welcome to our program.',
      });

      expect(component.showOfferModal()).toBe(false);
      expect(component.offerSuccessMessage()).toContain('successfully dispatched');
    });

    it('should display error message and keep modal open if sendInvitation fails', () => {
      invitesServiceMock.sendInvitation.mockReturnValue(
        throwError(() => ({
          error: { message: 'Conflict: Candidate already has an active offer.' },
          status: 409,
        }))
      );

      component.openOfferModal();
      fixture.detectChanges();

      component.submitOffer();

      expect(invitesServiceMock.sendInvitation).toHaveBeenCalled();
      expect(component.showOfferModal()).toBe(true);
      expect(component.offerErrorMessage()).toBe(
        'Conflict: Candidate already has an active offer.'
      );
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
});
