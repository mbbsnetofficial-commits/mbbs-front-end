import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { UcatPreviousYear } from './ucat-previous-year';
import { UcatPreviousYearService } from '../../services/ucat-previous-year.service';
import { UcatStreakService } from '../../services/ucat-streak.service';
import {
  UcatActiveSession,
  UcatQuestion,
  UcatTestResult
} from '../../models/ucat.model';
import { UcatPreviousYearPaper } from '../../models/ucat-previous-year.model';

describe('UcatPreviousYear', () => {
  let component: UcatPreviousYear;
  let fixture: ComponentFixture<UcatPreviousYear>;
  let previousYearServiceMock: {
    getPreviousYearPapers: ReturnType<typeof vi.fn>;
    saveAnswer: ReturnType<typeof vi.fn>;
    startPreviousYearTest: ReturnType<typeof vi.fn>;
    submitPreviousYearTest: ReturnType<typeof vi.fn>;
    getPreviousYearTestResult: ReturnType<typeof vi.fn>;
  };
  let streakServiceMock: {
    getStreak: ReturnType<typeof vi.fn>;
    recordStreak: ReturnType<typeof vi.fn>;
  };

  const samplePapers: UcatPreviousYearPaper[] = [
    {
      id: 501,
      paper_id: 'UCAT_2025_01',
      name: 'UCAT Official Mock Paper 2025',
      question_count: 233,
      duration: 120,
      total_marks: 3600
    }
  ];

  const sampleQuestions: UcatQuestion[] = [
    {
      id: 301,
      question: 'Sample Verbal Reasoning Question 1',
      option_a: 'True',
      option_b: 'False',
      option_c: 'Cannot Tell',
      option_d: 'None',
      subject: 'Verbal Reasoning'
    },
    {
      id: 302,
      question: 'Sample Decision Making Question 2',
      option_a: 'Yes',
      option_b: 'No',
      option_c: 'Undetermined',
      option_d: 'None',
      subject: 'Decision Making'
    }
  ];

  const sampleActiveSession: UcatActiveSession = {
    sessionId: 'session-py-999',
    durationMinutes: 120,
    totalQuestions: 2,
    questions: sampleQuestions,
    questionStates: [
      { questionId: 301, selectedOption: null, timeSpent: 0, visited: true },
      { questionId: 302, selectedOption: null, timeSpent: 0, visited: false }
    ],
    currentQuestionIndex: 0,
    startedAtTimestamp: Date.now(),
    test_type: 'PREVIOUS_YEAR_TEST'
  };

  const sampleResult: UcatTestResult = {
    sessionId: 'session-py-999',
    test_type: 'PREVIOUS_YEAR_TEST',
    score: 750,
    correct: 2,
    wrong: 0,
    skipped: 0,
    accuracy: 100,
    total_questions: 2,
    duration: 120,
    review: [
      {
        question_id: 301,
        question: 'Sample Verbal Reasoning Question 1',
        option_a: 'True',
        option_b: 'False',
        option_c: 'Cannot Tell',
        option_d: 'None',
        selected_option: 'A',
        correct_answer: 'A',
        isCorrect: true
      }
    ]
  };

  beforeEach(async () => {
    sessionStorage.clear();

    previousYearServiceMock = {
      getPreviousYearPapers: vi.fn().mockReturnValue(of({ success: true, data: samplePapers })),
      saveAnswer: vi.fn().mockReturnValue(of({ success: true, message: 'Saved' })),
      startPreviousYearTest: vi.fn().mockReturnValue(of({ success: true, sessionId: 'session-py-999', duration: 120, questions: sampleQuestions })),
      submitPreviousYearTest: vi.fn().mockReturnValue(of({ success: true, message: 'Submitted' })),
      getPreviousYearTestResult: vi.fn().mockReturnValue(of({ success: true, data: sampleResult }))
    };

    streakServiceMock = {
      getStreak: vi.fn().mockReturnValue(of({ success: true, data: { currentStreak: 3, longestStreak: 7 } })),
      recordStreak: vi.fn().mockReturnValue(of({ success: true, data: { currentStreak: 4, longestStreak: 7 } }))
    };

    await TestBed.configureTestingModule({
      imports: [UcatPreviousYear],
      providers: [
        provideRouter([]),
        { provide: UcatPreviousYearService, useValue: previousYearServiceMock },
        { provide: UcatStreakService, useValue: streakServiceMock }
      ]
    }).compileComponents();
  }, 30000);

  afterEach(() => {
    sessionStorage.clear();
  });

  it('A. should create component and load papers in papers mode when no active session exists', () => {
    fixture = TestBed.createComponent(UcatPreviousYear);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.view()).toBe('papers');
    expect(previousYearServiceMock.getPreviousYearPapers).toHaveBeenCalledTimes(1);
    expect(component.papers().length).toBe(1);

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.config-container')).toBeNull();
    expect(el.querySelector('.paper-stats')).toBeNull();
    expect(el.textContent).not.toContain('Configure Test & Start');
  }, 30000);

  it('A2. should start test directly on onStartTest(paper) using backend paper question_count and duration', () => {
    fixture = TestBed.createComponent(UcatPreviousYear);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.onStartTest(samplePapers[0]);

    expect(previousYearServiceMock.startPreviousYearTest).toHaveBeenCalledWith('UCAT_2025_01', {
      limit: 233,
      duration: 120
    });
    expect(component.view()).toBe('test');
    expect(component.activeSession()?.sessionId).toBe('session-py-999');
  });

  it('B. should restore active session from activeUcatPreviousYearTest in sessionStorage', () => {
    sessionStorage.setItem('activeUcatPreviousYearTest', JSON.stringify(sampleActiveSession));

    fixture = TestBed.createComponent(UcatPreviousYear);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.view()).toBe('test');
    expect(component.activeSession()?.sessionId).toBe('session-py-999');
    expect(component.questionStates().length).toBe(2);
    expect(component.remainingSeconds()).toBe(120 * 60);
  });

  it('C. should NOT call startPreviousYearTest API when restoring active session', () => {
    sessionStorage.setItem('activeUcatPreviousYearTest', JSON.stringify(sampleActiveSession));

    fixture = TestBed.createComponent(UcatPreviousYear);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(previousYearServiceMock.startPreviousYearTest).not.toHaveBeenCalled();
  });

  it('D. should handle question navigation (prev, next, jump)', () => {
    sessionStorage.setItem('activeUcatPreviousYearTest', JSON.stringify(sampleActiveSession));
    fixture = TestBed.createComponent(UcatPreviousYear);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.currentQuestionIndex()).toBe(0);

    component.nextQuestion();
    expect(component.currentQuestionIndex()).toBe(1);

    component.prevQuestion();
    expect(component.currentQuestionIndex()).toBe(0);

    component.jumpToQuestion(1);
    expect(component.currentQuestionIndex()).toBe(1);
  });

  it('E. should handle answer selection, toggling, and trigger saveAnswer API', () => {
    sessionStorage.setItem('activeUcatPreviousYearTest', JSON.stringify(sampleActiveSession));
    fixture = TestBed.createComponent(UcatPreviousYear);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.selectOption('A');
    expect(component.currentQuestionState()?.selectedOption).toBe('A');
    expect(previousYearServiceMock.saveAnswer).toHaveBeenCalledWith('session-py-999', {
      question_id: 301,
      selected_option: 'A',
      time_spent: 0
    });

    // Deselect by clicking same option
    component.selectOption('A');
    expect(component.currentQuestionState()?.selectedOption).toBeNull();
    expect(previousYearServiceMock.saveAnswer).toHaveBeenCalledWith('session-py-999', {
      question_id: 301,
      selected_option: null,
      time_spent: 0
    });
  });

  it('F. should calculate live progressPercentage based on actual answered questions', () => {
    sessionStorage.setItem('activeUcatPreviousYearTest', JSON.stringify(sampleActiveSession));
    fixture = TestBed.createComponent(UcatPreviousYear);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.progressPercentage()).toBe(0);

    // Answer Q1 (1/2 = 50%)
    component.selectOption('A');
    expect(component.answeredCount()).toBe(1);
    expect(component.progressPercentage()).toBe(50);

    // Jump to Q2 (must remain 50%)
    component.jumpToQuestion(1);
    expect(component.progressPercentage()).toBe(50);

    // Answer Q2 (2/2 = 100%)
    component.selectOption('B');
    expect(component.answeredCount()).toBe(2);
    expect(component.progressPercentage()).toBe(100);
  });

  it('G. should decrement remainingSeconds with timer tick', () => {
    vi.useFakeTimers();
    sessionStorage.setItem('activeUcatPreviousYearTest', JSON.stringify(sampleActiveSession));
    fixture = TestBed.createComponent(UcatPreviousYear);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const initialSeconds = component.remainingSeconds();
    vi.advanceTimersByTime(3000);
    expect(component.remainingSeconds()).toBe(initialSeconds - 3);

    component.ngOnDestroy();
    vi.useRealTimers();
  });

  it('H. should open and close review modal', () => {
    sessionStorage.setItem('activeUcatPreviousYearTest', JSON.stringify(sampleActiveSession));
    fixture = TestBed.createComponent(UcatPreviousYear);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.showReviewModal()).toBe(false);
    component.openReviewModal();
    expect(component.showReviewModal()).toBe(true);

    component.closeReviewModal();
    expect(component.showReviewModal()).toBe(false);
  });

  it('I. should submit test with exact answers payload and session ID', () => {
    sessionStorage.setItem('activeUcatPreviousYearTest', JSON.stringify(sampleActiveSession));
    fixture = TestBed.createComponent(UcatPreviousYear);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.selectOption('B');
    component.onSubmitTest();

    expect(previousYearServiceMock.submitPreviousYearTest).toHaveBeenCalledWith({
      sessionId: 'session-py-999',
      answers: [
        { question_id: 301, selected_option: 'B', time_spent: 0 }
      ]
    });
  });

  it('J. should fetch result and display result screen upon successful submit', () => {
    sessionStorage.setItem('activeUcatPreviousYearTest', JSON.stringify(sampleActiveSession));
    fixture = TestBed.createComponent(UcatPreviousYear);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.onSubmitTest();

    expect(previousYearServiceMock.getPreviousYearTestResult).toHaveBeenCalledWith('session-py-999');
    expect(component.view()).toBe('result');
    expect(component.testResult()?.score).toBe(750);
  });

  it('K. should remove activeUcatPreviousYearTest from sessionStorage after result is fetched', () => {
    sessionStorage.setItem('activeUcatPreviousYearTest', JSON.stringify(sampleActiveSession));
    fixture = TestBed.createComponent(UcatPreviousYear);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(sessionStorage.getItem('activeUcatPreviousYearTest')).toBeTruthy();

    component.onSubmitTest();

    expect(sessionStorage.getItem('activeUcatPreviousYearTest')).toBeNull();
  });

  it('L. should retain storage if submission fails so retry is possible', () => {
    sessionStorage.setItem('activeUcatPreviousYearTest', JSON.stringify(sampleActiveSession));
    previousYearServiceMock.submitPreviousYearTest.mockReturnValue(throwError(() => ({ status: 500, message: 'Submission error' })));

    fixture = TestBed.createComponent(UcatPreviousYear);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.onSubmitTest();

    expect(component.errorMessage()).toBe('Submission error');
    expect(sessionStorage.getItem('activeUcatPreviousYearTest')).toBeTruthy();
  });

  it('M. should block duplicate submit when isSubmittingTest is true', () => {
    sessionStorage.setItem('activeUcatPreviousYearTest', JSON.stringify(sampleActiveSession));
    fixture = TestBed.createComponent(UcatPreviousYear);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.isSubmittingTest.set(true);
    component.onSubmitTest();

    expect(previousYearServiceMock.submitPreviousYearTest).not.toHaveBeenCalled();
  });

  it('N. should retain storage on initialization so F5 refresh restores the test', () => {
    sessionStorage.setItem('activeUcatPreviousYearTest', JSON.stringify(sampleActiveSession));

    fixture = TestBed.createComponent(UcatPreviousYear);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(sessionStorage.getItem('activeUcatPreviousYearTest')).toBeTruthy();

    // Simulate F5 page refresh
    const fixture2 = TestBed.createComponent(UcatPreviousYear);
    const component2 = fixture2.componentInstance;
    fixture2.detectChanges();

    expect(component2.view()).toBe('test');
    expect(component2.activeSession()?.sessionId).toBe('session-py-999');
    component2.ngOnDestroy();
  });

  it('O. should render redesigned result page with score, accuracy, metrics and filter pills', () => {
    fixture = TestBed.createComponent(UcatPreviousYear);
    component = fixture.componentInstance;
    component.testResult.set({
      sessionId: 'session-py-999',
      score: 1,
      total_questions: 1,
      correct: 1,
      wrong: 0,
      skipped: 0,
      accuracy: 100,
      duration: 120,
      subjects: ['Abstract Reasoning'],
      started_at: '2026-08-17T10:00:00Z',
      submitted_at: '2026-08-17T12:00:00Z',
      review: [
        {
          question_id: 201,
          question: 'Which shape belongs to Set A?',
          option_a: 'Square',
          option_b: 'Circle',
          option_c: 'Triangle',
          option_d: 'Star',
          selected_option: 'A',
          correct_answer: 'A',
          is_correct: true,
          time_spent: 30,
          explanation: 'Set A contains shapes with 4 right angles.'
        }
      ]
    });
    component.view.set('result');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.result-header h1')?.textContent).toContain('Result');
    expect(compiled.querySelector('.btn-back-learning')).toBeTruthy();
    expect(compiled.querySelector('.score-card .stat-val')?.textContent?.trim()).toBe('1');
    expect(compiled.querySelector('.accuracy-card .stat-val')?.textContent?.trim()).toBe('100%');
    expect(compiled.querySelectorAll('.review-card').length).toBe(1);
    expect(compiled.querySelector('.tag-correct')?.textContent).toBe('Correct answer');
  });

  it('P. backToLearningReport should navigate to /dynamic/ucat', () => {
    fixture = TestBed.createComponent(UcatPreviousYear);
    component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.backToLearningReport();

    expect(navigateSpy).toHaveBeenCalledWith(['/dynamic/ucat']);
    expect(component.view()).toBe('papers');
  });

  it('Q. should render focused test runner workspace and support skipQuestion', () => {
    sessionStorage.setItem('activeUcatPreviousYearTest', JSON.stringify(sampleActiveSession));
    fixture = TestBed.createComponent(UcatPreviousYear);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.test-runner-container')).toBeTruthy();
    expect(compiled.querySelector('.test-runner-header')).toBeTruthy();
    expect(compiled.querySelector('.runner-question-card')).toBeTruthy();
    expect(compiled.querySelector('.navigator-sidebar')).toBeTruthy();
    expect(compiled.querySelectorAll('.runner-option-row').length).toBe(4);
    expect(compiled.querySelectorAll('.nav-cell').length).toBe(2);

    expect(component.currentQuestionIndex()).toBe(0);
    component.skipQuestion();
    expect(component.currentQuestionIndex()).toBe(1);
  });
});
