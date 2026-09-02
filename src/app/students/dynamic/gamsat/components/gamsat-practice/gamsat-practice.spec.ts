import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { GamsatPractice } from './gamsat-practice';
import { environment } from '../../../../../../environments/environment';
import { API } from '../../constants/api.constants';

describe('GamsatPractice', () => {
  let component: GamsatPractice;
  let fixture: ComponentFixture<GamsatPractice>;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      imports: [GamsatPractice],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(GamsatPractice);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpTesting.verify();
    sessionStorage.clear();
  });

  it('should create and load streak and builtin tests on init', () => {
    fixture.detectChanges();

    // Streak request
    const streakReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STREAK.BASE}`);
    expect(streakReq.request.method).toBe('GET');
    streakReq.flush({
      success: true,
      data: { currentStreak: 5, longestStreak: 12, lastActivityDate: '2026-08-30', history: [] }
    });

    // Builtin tests request
    const builtinReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.BUILTIN}`);
    expect(builtinReq.request.method).toBe('GET');
    builtinReq.flush({
      success: true,
      data: [
        {
          id: 'gamsat-mock-1',
          test_code: 'GAMSAT-MOCK-01',
          title: 'Full Mock Exam 1',
          duration_minutes: 180,
          total_questions: 137
        }
      ]
    });

    expect(component.streakData()?.currentStreak).toBe(5);
    expect(component.builtinTests().length).toBe(1);
    expect(component.view()).toBe('catalogue');
  });

  it('should launch a practice mock exam, enter test runner, and handle question answering and submission', () => {
    fixture.detectChanges();

    const streakReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STREAK.BASE}`);
    streakReq.flush({ success: true, data: { currentStreak: 1 } });
    const builtinReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.BUILTIN}`);
    builtinReq.flush({
      success: true,
      data: [
        {
          id: 'gamsat-mock-1',
          title: 'GAMSAT Mock 1',
          duration_minutes: 180,
          total_questions: 2
        }
      ]
    });

    // Start Built-in Test
    component.startBuiltinTest(component.builtinTests()[0]);

    const startReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.START}`);
    expect(startReq.request.method).toBe('POST');
    startReq.flush({
      success: true,
      data: {
        sessionId: 'sess-builtin-123',
        testName: 'GAMSAT Mock 1',
        durationMinutes: 180,
        totalQuestions: 2,
        remainingTimeSeconds: 10800,
        questions: [
          {
            id: 1,
            question_id: 1001,
            question: 'Sample question 1?',
            option_a: 'Opt A',
            option_b: 'Opt B',
            option_c: 'Opt C',
            option_d: 'Opt D',
            stimulus_text: 'Stimulus 1'
          },
          {
            id: 2,
            question_id: 1002,
            question: 'Sample question 2?',
            option_a: 'Opt 2A',
            option_b: 'Opt 2B',
            option_c: 'Opt 2C',
            option_d: 'Opt 2D'
          }
        ]
      }
    });

    expect(component.view()).toBe('test');
    expect(component.activeSession()?.sessionId).toBe('sess-builtin-123');
    expect(component.questionStates().length).toBe(2);

    // Select Option A on question 1 -> triggers autosave
    component.selectOption('A');
    expect(component.questionStates()[0].selectedOption).toBe('A');

    const autoSaveReq = httpTesting.expectOne(
      `${environment.gamsatApiBaseUrl}${API.TEST.SESSIONS}/sess-builtin-123`
    );
    expect(autoSaveReq.request.method).toBe('PATCH');
    expect(autoSaveReq.request.body).toEqual({
      questionId: 1001,
      selectedOption: 'A',
      timeSpent: 0
    });
    autoSaveReq.flush({ success: true });

    // Navigate to next question
    component.nextQuestion();
    expect(component.currentQuestionIndex()).toBe(1);

    // Submit test
    component.onSubmitTest();

    const submitReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.SUBMIT}`);
    expect(submitReq.request.method).toBe('POST');
    expect(submitReq.request.body.sessionId).toBe('sess-builtin-123');
    submitReq.flush({
      success: true,
      data: {
        score: '1 / 2',
        accuracy: 50,
        correct: 1,
        wrong: 1,
        skipped: 0,
        duration: 180,
        review: [
          {
            question_id: 1001,
            question: 'Sample question 1?',
            option_a: 'Opt A',
            option_b: 'Opt B',
            option_c: 'Opt C',
            option_d: 'Opt D',
            selected_option: 'A',
            correct_answer: 'A',
            isCorrect: true
          }
        ]
      }
    });

    expect(component.view()).toBe('result');
    expect(component.testResult()?.score).toBe('1 / 2');
    expect(component.testResult()?.accuracy).toBe(50);
  });

  it('should fetch test result using getTestResult and render results view', () => {
    fixture.detectChanges();

    const streakReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STREAK.BASE}`);
    streakReq.flush({ success: true, data: null });

    const testsReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.BUILTIN}`);
    testsReq.flush({ success: true, data: [] });

    component.loadResult('sess-practice-completed-999');

    expect(component.isLoadingResult()).toBe(true);
    expect(component.view()).toBe('result');

    const resultReq = httpTesting.expectOne(
      `${environment.gamsatApiBaseUrl}${API.TEST.SESSIONS}/sess-practice-completed-999/result`
    );
    expect(resultReq.request.method).toBe('GET');

    resultReq.flush({
      success: true,
      data: {
        sessionId: 'sess-practice-completed-999',
        score: '2 / 2',
        rawScore: 2,
        maximumRawScore: 2,
        accuracy: 100,
        totalQuestions: 2,
        correct: 2,
        wrong: 0,
        skipped: 0,
        review: [
          {
            question_id: 1001,
            question: 'Sample question 1?',
            option_a: 'Opt A',
            option_b: 'Opt B',
            option_c: 'Opt C',
            option_d: 'Opt D',
            selected_option: 'A',
            correct_answer: 'A',
            isCorrect: true
          }
        ]
      }
    });

    expect(component.isLoadingResult()).toBe(false);
    expect(component.testResult()?.score).toBe('2 / 2');
    expect(component.testResult()?.accuracy).toBe(100);
    expect(component.allReviewQuestions().length).toBe(1);
  });

  it('should handle custom section drill result flow and submission', () => {
    fixture.detectChanges();

    const streakReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STREAK.BASE}`);
    streakReq.flush({ success: true, data: null });
    const testsReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.BUILTIN}`);
    testsReq.flush({ success: true, data: [] });

    // Start Section Drill
    component.startSectionDrill({
      code: 'SECTION_I',
      name: 'Section I Drill',
      subtitle: 'Humanities',
      questionCount: 10,
      durationMinutes: 15,
      iconName: 'book-open',
      tag: 'Section I'
    });

    const startReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.START}`);
    expect(startReq.request.method).toBe('POST');
    startReq.flush({
      success: true,
      data: {
        sessionId: 'sess-custom-drill-456',
        testType: 'SECTIONAL_TEST',
        questions: [
          {
            id: 2001,
            question_id: 2001,
            question: 'Custom Section I drill question?',
            option_a: 'A1',
            option_b: 'B1',
            option_c: 'C1',
            option_d: 'D1'
          }
        ]
      }
    });

    expect(component.view()).toBe('test');
    expect(component.activeSession()?.sessionId).toBe('sess-custom-drill-456');

    // Answer & Submit
    component.selectOption('C');
    const autoReq = httpTesting.expectOne(
      `${environment.gamsatApiBaseUrl}${API.TEST.SESSIONS}/sess-custom-drill-456`
    );
    autoReq.flush({ success: true });

    component.onSubmitTest();

    const submitReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.SUBMIT}`);
    submitReq.flush({
      success: true,
      data: {
        score: '1 / 1',
        accuracy: 100,
        correct: 1,
        wrong: 0,
        skipped: 0,
        review: [
          {
            question_id: 2001,
            question: 'Custom Section I drill question?',
            selected_option: 'C',
            correct_answer: 'C',
            isCorrect: true
          }
        ]
      }
    });

    expect(component.view()).toBe('result');
    expect(component.testResult()?.sessionId).toBe('sess-custom-drill-456');
    expect(component.testResult()?.accuracy).toBe(100);
  });

  it('should display error message when result API fails', () => {
    fixture.detectChanges();

    const streakReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STREAK.BASE}`);
    streakReq.flush({ success: true, data: null });
    const testsReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.BUILTIN}`);
    testsReq.flush({ success: true, data: [] });

    component.loadResult('sess-err-999');

    expect(component.isLoadingResult()).toBe(true);

    const resultReq = httpTesting.expectOne(
      `${environment.gamsatApiBaseUrl}${API.TEST.SESSIONS}/sess-err-999/result`
    );
    resultReq.flush(
      { message: 'Not found' },
      { status: 404, statusText: 'Not Found' }
    );

    expect(component.isLoadingResult()).toBe(false);
    expect(component.errorMessage()).toContain('Test result not found');
  });

  it('should not call result API if sessionId is empty', () => {
    fixture.detectChanges();

    const streakReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STREAK.BASE}`);
    streakReq.flush({ success: true, data: null });
    const testsReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.BUILTIN}`);
    testsReq.flush({ success: true, data: [] });

    component.loadResult('');

    expect(component.isLoadingResult()).toBe(false);
    expect(component.errorMessage()).toBe('Test session ID is missing. The result cannot be loaded.');
  });
});
