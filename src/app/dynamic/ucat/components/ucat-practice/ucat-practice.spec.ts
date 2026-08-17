import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { UcatPractice } from './ucat-practice';
import { UcatService } from '../../services/ucat.service';
import { UcatStreakService } from '../../services/ucat-streak.service';
import {
  UcatActiveSession,
  UcatQuestion,
  UcatTestResult
} from '../../models/ucat.model';

describe('UcatPractice', () => {
  let component: UcatPractice;
  let fixture: ComponentFixture<UcatPractice>;
  let ucatServiceMock: {
    getSubjects: ReturnType<typeof vi.fn>;
    getChapters: ReturnType<typeof vi.fn>;
    getTopics: ReturnType<typeof vi.fn>;
    saveAnswer: ReturnType<typeof vi.fn>;
    startTest: ReturnType<typeof vi.fn>;
    submitTest: ReturnType<typeof vi.fn>;
    getTestResult: ReturnType<typeof vi.fn>;
    getTestSession: ReturnType<typeof vi.fn>;
    getHistory: ReturnType<typeof vi.fn>;
  };
  let streakServiceMock: {
    getStreak: ReturnType<typeof vi.fn>;
    recordStreak: ReturnType<typeof vi.fn>;
  };

  const sampleQuestions: UcatQuestion[] = [
    {
      id: 101,
      question: 'Which of the following is logically valid?',
      option_a: 'Option A statement',
      option_b: 'Option B statement',
      option_c: 'Option C statement',
      option_d: 'Option D statement',
      subject: 'Decision Making',
      chapter: 'Deductive Reasoning'
    },
    {
      id: 102,
      question: 'Evaluate the following conclusion:',
      option_a: 'True',
      option_b: 'False',
      option_c: 'Cannot Tell',
      option_d: 'None',
      subject: 'Decision Making',
      chapter: 'Deductive Reasoning'
    }
  ];

  const sampleActiveSession: UcatActiveSession = {
    sessionId: 'session-ucat-practice-456',
    durationMinutes: 15,
    totalQuestions: 2,
    questions: sampleQuestions,
    questionStates: [
      { questionId: 101, selectedOption: null, timeSpent: 0, visited: true },
      { questionId: 102, selectedOption: null, timeSpent: 0, visited: false }
    ],
    currentQuestionIndex: 0,
    startedAtTimestamp: Date.now(),
    test_type: 'CUSTOM_TEST'
  };

  const sampleResult: UcatTestResult = {
    sessionId: 'session-ucat-practice-456',
    test_type: 'CUSTOM_TEST',
    score: 800,
    correct: 2,
    wrong: 0,
    skipped: 0,
    accuracy: 100,
    total_questions: 2,
    duration: 15,
    review: [
      {
        question_id: 101,
        question: 'Which of the following is logically valid?',
        option_a: 'Option A statement',
        option_b: 'Option B statement',
        option_c: 'Option C statement',
        option_d: 'Option D statement',
        selected_option: 'A',
        correct_answer: 'A',
        isCorrect: true
      }
    ]
  };

  beforeEach(async () => {
    sessionStorage.clear();

    ucatServiceMock = {
      getSubjects: vi.fn().mockReturnValue(of({ success: true, data: ['DECISION_MAKING', 'VERBAL_REASONING'] })),
      getChapters: vi.fn().mockReturnValue(of({ success: true, data: [{ chapter: 'Deductive Reasoning' }] })),
      getTopics: vi.fn().mockReturnValue(of({ success: true, data: [{ id: 1, name: 'Logic', subject: 'DECISION_MAKING', chapter: 'Deductive Reasoning' }] })),
      saveAnswer: vi.fn().mockReturnValue(of({ success: true, message: 'Saved' })),
      startTest: vi.fn().mockReturnValue(of({ success: true, sessionId: 'session-new-789', duration: 15, questions: sampleQuestions })),
      submitTest: vi.fn().mockReturnValue(of({ success: true, message: 'Submitted successfully' })),
      getTestResult: vi.fn().mockReturnValue(of({ success: true, data: sampleResult })),
      getTestSession: vi.fn().mockReturnValue(of({ success: true, sessionId: 'session-ucat-practice-456', duration: 15, questions: sampleQuestions })),
      getHistory: vi.fn().mockReturnValue(of({ success: true, data: { sessions: [], total: 0, page: 1, limit: 20, totalPages: 1 } }))
    };

    streakServiceMock = {
      getStreak: vi.fn().mockReturnValue(of({ success: true, data: { currentStreak: 5, longestStreak: 10, lastActivityDate: '2026-08-16' } })),
      recordStreak: vi.fn().mockReturnValue(of({ success: true, data: { currentStreak: 6, longestStreak: 10 } }))
    };

    await TestBed.configureTestingModule({
      imports: [UcatPractice],
      providers: [
        provideRouter([]),
        { provide: UcatService, useValue: ucatServiceMock },
        { provide: UcatStreakService, useValue: streakServiceMock }
      ]
    }).compileComponents();
  }, 30000);

  afterEach(() => {
    sessionStorage.clear();
  });

  it('A. should create component and initialize in wizard mode when no active session exists', () => {
    fixture = TestBed.createComponent(UcatPractice);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.view()).toBe('wizard');
    expect(ucatServiceMock.getSubjects).toHaveBeenCalledTimes(1);

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-ucat-previous-year')).toBeNull();
    expect(el.textContent).not.toContain('Available Previous Year Exam Papers');
    expect(el.textContent).not.toContain('UCAT previous papers');
  }, 30000);

  it('B. should restore active session from sessionStorage and start in test mode', () => {
    sessionStorage.setItem('activeUcatPracticeTest', JSON.stringify(sampleActiveSession));

    fixture = TestBed.createComponent(UcatPractice);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.view()).toBe('test');
    expect(component.activeSession()?.sessionId).toBe('session-ucat-practice-456');
    expect(component.questionStates().length).toBe(2);
    expect(component.remainingSeconds()).toBe(15 * 60);
  });

  it('C. should NOT call startTest API when restoring active session', () => {
    sessionStorage.setItem('activeUcatPracticeTest', JSON.stringify(sampleActiveSession));

    fixture = TestBed.createComponent(UcatPractice);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(ucatServiceMock.startTest).not.toHaveBeenCalled();
  });

  it('D. should handle answer selection, toggling, and trigger saveAnswer API', () => {
    sessionStorage.setItem('activeUcatPracticeTest', JSON.stringify(sampleActiveSession));
    fixture = TestBed.createComponent(UcatPractice);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.selectOption('A');
    expect(component.currentQuestionState()?.selectedOption).toBe('A');
    expect(ucatServiceMock.saveAnswer).toHaveBeenCalledWith('session-ucat-practice-456', {
      question_id: 101,
      selected_option: 'A',
      time_spent: 0
    });

    // Deselect by clicking again
    component.selectOption('A');
    expect(component.currentQuestionState()?.selectedOption).toBeNull();
    expect(ucatServiceMock.saveAnswer).toHaveBeenCalledWith('session-ucat-practice-456', {
      question_id: 101,
      selected_option: null,
      time_spent: 0
    });
  });

  it('E. should calculate live progressPercentage correctly based on answered questions, NOT current index', () => {
    sessionStorage.setItem('activeUcatPracticeTest', JSON.stringify(sampleActiveSession));
    fixture = TestBed.createComponent(UcatPractice);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.progressPercentage()).toBe(0);

    // Answer Q1 (1 of 2 answered = 50%)
    component.selectOption('A');
    expect(component.answeredCount()).toBe(1);
    expect(component.progressPercentage()).toBe(50);

    // Navigate to Q2 without answering (progress MUST stay 50%)
    component.nextQuestion();
    expect(component.currentQuestionIndex()).toBe(1);
    expect(component.progressPercentage()).toBe(50);

    // Answer Q2 (2 of 2 answered = 100%)
    component.selectOption('C');
    expect(component.answeredCount()).toBe(2);
    expect(component.progressPercentage()).toBe(100);
  });

  it('F. should handle question navigation (next, prev, jump)', () => {
    sessionStorage.setItem('activeUcatPracticeTest', JSON.stringify(sampleActiveSession));
    fixture = TestBed.createComponent(UcatPractice);
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

  it('G. should open and close review before submit modal', () => {
    sessionStorage.setItem('activeUcatPracticeTest', JSON.stringify(sampleActiveSession));
    fixture = TestBed.createComponent(UcatPractice);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.showReviewModal()).toBe(false);
    component.openReviewModal();
    expect(component.showReviewModal()).toBe(true);

    component.closeReviewModal();
    expect(component.showReviewModal()).toBe(false);
  });

  it('H. should decrement remainingSeconds with timer tick', () => {
    vi.useFakeTimers();
    sessionStorage.setItem('activeUcatPracticeTest', JSON.stringify(sampleActiveSession));
    fixture = TestBed.createComponent(UcatPractice);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const initialSeconds = component.remainingSeconds();
    vi.advanceTimersByTime(2000);
    expect(component.remainingSeconds()).toBe(initialSeconds - 2);

    component.ngOnDestroy();
    vi.useRealTimers();
  });

  it('I. should submit test with exact answers payload and session ID', () => {
    sessionStorage.setItem('activeUcatPracticeTest', JSON.stringify(sampleActiveSession));
    fixture = TestBed.createComponent(UcatPractice);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.selectOption('A');
    component.onSubmitTest();

    expect(ucatServiceMock.submitTest).toHaveBeenCalledWith({
      sessionId: 'session-ucat-practice-456',
      answers: [
        { question_id: 101, selected_option: 'A', time_spent: 0 }
      ]
    });
  });

  it('J. should fetch result and switch to result view upon successful submit', () => {
    sessionStorage.setItem('activeUcatPracticeTest', JSON.stringify(sampleActiveSession));
    fixture = TestBed.createComponent(UcatPractice);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.onSubmitTest();

    expect(ucatServiceMock.getTestResult).toHaveBeenCalledWith('session-ucat-practice-456');
    expect(component.view()).toBe('result');
    expect(component.testResult()?.score).toBe(800);
  });

  it('K. should remove activeUcatPracticeTest from sessionStorage only after result is received', () => {
    sessionStorage.setItem('activeUcatPracticeTest', JSON.stringify(sampleActiveSession));
    fixture = TestBed.createComponent(UcatPractice);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(sessionStorage.getItem('activeUcatPracticeTest')).toBeTruthy();

    component.onSubmitTest();

    expect(sessionStorage.getItem('activeUcatPracticeTest')).toBeNull();
  });

  it('L. should preserve active session in storage if submission fails', () => {
    sessionStorage.setItem('activeUcatPracticeTest', JSON.stringify(sampleActiveSession));
    ucatServiceMock.submitTest.mockReturnValue(throwError(() => ({ status: 500, message: 'Server error' })));

    fixture = TestBed.createComponent(UcatPractice);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.onSubmitTest();

    expect(component.errorMessage()).toBe('Server error');
    expect(sessionStorage.getItem('activeUcatPracticeTest')).toBeTruthy();
  });

  it('M. should block duplicate submission when isSubmittingTest is true', () => {
    sessionStorage.setItem('activeUcatPracticeTest', JSON.stringify(sampleActiveSession));
    fixture = TestBed.createComponent(UcatPractice);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.isSubmittingTest.set(true);
    component.onSubmitTest();

    expect(ucatServiceMock.submitTest).not.toHaveBeenCalled();
  });

  it('N. should retain storage during F5 restoration so refresh restores the test', () => {
    sessionStorage.setItem('activeUcatPracticeTest', JSON.stringify(sampleActiveSession));

    fixture = TestBed.createComponent(UcatPractice);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // After component init (simulating first load), storage MUST remain intact
    expect(sessionStorage.getItem('activeUcatPracticeTest')).toBeTruthy();

    // Simulate F5 page refresh by creating a new component instance
    const fixture2 = TestBed.createComponent(UcatPractice);
    const component2 = fixture2.componentInstance;
    fixture2.detectChanges();

    expect(component2.view()).toBe('test');
    expect(component2.activeSession()?.sessionId).toBe('session-ucat-practice-456');
    component2.ngOnDestroy();
  });

  it('O. should render redesigned result page with score, accuracy, metrics and filter pills', () => {
    fixture = TestBed.createComponent(UcatPractice);
    component = fixture.componentInstance;
    component.testResult.set({
      sessionId: 'session-ucat-practice-456',
      score: 1,
      total_questions: 1,
      correct: 1,
      wrong: 0,
      skipped: 0,
      accuracy: 100,
      duration: 15,
      subjects: ['Verbal Reasoning'],
      started_at: '2026-08-17T10:00:00Z',
      submitted_at: '2026-08-17T10:15:00Z',
      review: [
        {
          question_id: 101,
          question: 'What is the main theme of the passage?',
          option_a: 'Option A text',
          option_b: 'Option B text',
          option_c: 'Option C text',
          option_d: 'Option D text',
          selected_option: 'A',
          correct_answer: 'A',
          is_correct: true,
          time_spent: 45,
          explanation: 'Passage clearly indicates Option A.'
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
    fixture = TestBed.createComponent(UcatPractice);
    component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.backToLearningReport();

    expect(navigateSpy).toHaveBeenCalledWith(['/dynamic/ucat']);
    expect(component.view()).toBe('wizard');
  });

  it('Q. should render focused test runner workspace and support skipQuestion', () => {
    sessionStorage.setItem('activeUcatPracticeTest', JSON.stringify(sampleActiveSession));
    fixture = TestBed.createComponent(UcatPractice);
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
