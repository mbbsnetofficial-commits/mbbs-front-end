import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { GamsatPreviousYear } from './gamsat-previous-year';
import { environment } from '../../../../../../environments/environment';
import { API } from '../../constants/api.constants';

describe('GamsatPreviousYear', () => {
  let component: GamsatPreviousYear;
  let fixture: ComponentFixture<GamsatPreviousYear>;
  let httpTesting: HttpTestingController;

  const mockPapers = [
    {
      id: '44dba1ca30e7a59f101b1ab1',
      paperId: '44dba1ca30e7a59f101b1ab1',
      numericId: 11,
      name: 'GAMSAT_2019_STYLE',
      title: 'GAMSAT 2019 STYLE',
      questionCount: 137,
      durationMinutes: 270,
      examType: 'gamsat',
      isActive: true,
      uploadedAt: '2026-08-29T14:44:22.000Z'
    }
  ];

  const mockStartResponse = {
    success: true,
    data: {
      sessionId: 'gamsat-session-test-123',
      paperId: '44dba1ca30e7a59f101b1ab1',
      testName: 'GAMSAT 2019 STYLE',
      testType: 'PREVIOUS_YEAR',
      totalQuestions: 2,
      durationMinutes: 270,
      startedAt: '2026-08-30T10:00:00.000Z',
      remainingTimeSeconds: 16200,
      status: 'IN_PROGRESS',
      questions: [
        {
          id: 38001,
          question_id: 38001,
          question: 'What is the primary conclusion of the stimulus passage?',
          stimulus_text: 'Passage concerning social structures in ancient civilizations...',
          stimulus_title: 'Unit 1: Reasoning in Humanities',
          unit: 'Unit 1',
          section: 'SECTION_I',
          option_a: 'Structure A',
          option_b: 'Structure B',
          option_c: 'Structure C',
          option_d: 'Structure D'
        },
        {
          id: 38002,
          question_id: 38002,
          question: 'Calculate the rate of reaction based on the graphical data.',
          stimulus_text: 'Kinetic curves for enzyme catalysis under standard conditions.',
          stimulus_image: 'https://cdn.example.com/stimulus-chart.png',
          unit: 'Unit 2',
          section: 'SECTION_III',
          option_a: '0.25 mol/s',
          option_b: '0.50 mol/s',
          option_c: '0.75 mol/s',
          option_d: '1.00 mol/s'
        }
      ]
    }
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [GamsatPreviousYear],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(GamsatPreviousYear);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpTesting.verify();
    sessionStorage.clear();
  });

  it('1. should load papers successfully on init', () => {
    fixture.detectChanges();

    // Streak request
    const streakReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STREAK.BASE}`);
    expect(streakReq.request.method).toBe('GET');
    streakReq.flush({
      success: true,
      data: { currentStreak: 3, longestStreak: 5, history: [] }
    });

    // Papers request
    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    expect(papersReq.request.method).toBe('GET');
    papersReq.flush({ success: true, data: mockPapers });

    expect(component.papers().length).toBe(1);
    expect(component.filteredPapers()[0].title).toBe('GAMSAT 2019 STYLE');
    expect(component.isLoadingPapers()).toBe(false);
    expect(component.view()).toBe('papers');
  });

  it('2. should handle empty papers response gracefully', () => {
    fixture.detectChanges();

    const streakReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STREAK.BASE}`);
    streakReq.flush({ success: true, data: null });

    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({ success: true, data: [] });

    expect(component.papers().length).toBe(0);
    expect(component.filteredPapers().length).toBe(0);
    expect(component.isLoadingPapers()).toBe(false);
  });

  it('3. should handle papers API error and display error banner', () => {
    fixture.detectChanges();

    const streakReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STREAK.BASE}`);
    streakReq.flush({ success: true, data: null });

    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({ message: 'Network timeout' }, { status: 500, statusText: 'Server Error' });

    expect(component.isLoadingPapers()).toBe(false);
    expect(component.errorMessage()).toBeTruthy();
  });

  it('4. should transition to config view when a paper is selected', () => {
    fixture.detectChanges();

    const streakReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STREAK.BASE}`);
    streakReq.flush({ success: true, data: null });
    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({ success: true, data: mockPapers });

    component.onSelectPaper(mockPapers[0]);
    expect(component.selectedPaper()).toBe(mockPapers[0]);
    expect(component.view()).toBe('config');
  });

  it('5. should start paper and initialize active exam runner session', () => {
    fixture.detectChanges();

    const streakReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STREAK.BASE}`);
    streakReq.flush({ success: true, data: null });
    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({ success: true, data: mockPapers });

    component.onSelectPaper(mockPapers[0]);
    component.onStartTest();

    const startReq = httpTesting.expectOne(
      `${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}/${mockPapers[0].id}/start`
    );
    expect(startReq.request.method).toBe('POST');
    startReq.flush(mockStartResponse);

    expect(component.view()).toBe('test');
    expect(component.activeSession()?.sessionId).toBe('gamsat-session-test-123');
    expect(component.questionStates().length).toBe(2);
    expect(component.currentQuestionIndex()).toBe(0);
    expect(component.currentQuestion()?.id).toBe(38001);
    expect(component.currentQuestion()?.stimulus_title).toBe('Unit 1: Reasoning in Humanities');
    expect(component.remainingSeconds()).toBe(16200);
  });

  it('6. should select answers, update state, and autosave to backend', () => {
    fixture.detectChanges();

    const streakReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STREAK.BASE}`);
    streakReq.flush({ success: true, data: null });
    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({ success: true, data: mockPapers });

    component.onStartTest(mockPapers[0]);
    const startReq = httpTesting.expectOne(
      `${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}/${mockPapers[0].id}/start`
    );
    startReq.flush(mockStartResponse);

    // Select Option A on question 0
    component.selectOption('A');
    expect(component.currentQuestionState()?.selectedOption).toBe('A');
    expect(component.answeredCount()).toBe(1);

    // Verify Autosave request
    const autosaveReq = httpTesting.expectOne(
      `${environment.gamsatApiBaseUrl}${API.TEST.SESSIONS}/gamsat-session-test-123`
    );
    expect(autosaveReq.request.method).toBe('PATCH');
    expect(autosaveReq.request.body.questionId).toBe(38001);
    expect(autosaveReq.request.body.selectedOption).toBe('A');
    expect(autosaveReq.request.body.timeSpent).toBe(0);
    autosaveReq.flush({ success: true });
  });

  it('7. should navigate through questions correctly', () => {
    fixture.detectChanges();

    const streakReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STREAK.BASE}`);
    streakReq.flush({ success: true, data: null });
    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({ success: true, data: mockPapers });

    component.onStartTest(mockPapers[0]);
    const startReq = httpTesting.expectOne(
      `${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}/${mockPapers[0].id}/start`
    );
    startReq.flush(mockStartResponse);

    expect(component.currentQuestionIndex()).toBe(0);

    // Next
    component.nextQuestion();
    expect(component.currentQuestionIndex()).toBe(1);
    expect(component.currentQuestion()?.id).toBe(38002);
    expect(component.currentQuestion()?.stimulus_image).toBe('https://cdn.example.com/stimulus-chart.png');

    // Previous
    component.prevQuestion();
    expect(component.currentQuestionIndex()).toBe(0);

    // Jump
    component.jumpToQuestion(1);
    expect(component.currentQuestionIndex()).toBe(1);
  });

  it('8. should submit exam and display result view with review breakdown', () => {
    fixture.detectChanges();

    const streakReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STREAK.BASE}`);
    streakReq.flush({ success: true, data: null });
    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({ success: true, data: mockPapers });

    component.onStartTest(mockPapers[0]);
    const startReq = httpTesting.expectOne(
      `${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}/${mockPapers[0].id}/start`
    );
    startReq.flush(mockStartResponse);

    component.selectOption('A');
    const autosaveReq = httpTesting.expectOne(
      `${environment.gamsatApiBaseUrl}${API.TEST.SESSIONS}/gamsat-session-test-123`
    );
    autosaveReq.flush({ success: true });

    component.onSubmitTest();

    const submitReq = httpTesting.expectOne(
      `${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.SUBMIT}`
    );
    expect(submitReq.request.method).toBe('POST');
    expect(submitReq.request.body.sessionId).toBe('gamsat-session-test-123');

    submitReq.flush({
      success: true,
      data: {
        sessionId: 'gamsat-session-test-123',
        score: '1 / 2',
        rawScore: 1,
        maximumRawScore: 2,
        accuracy: 50,
        totalQuestions: 2,
        correct: 1,
        wrong: 1,
        skipped: 0,
        review: [
          {
            id: 38001,
            question_id: 38001,
            question: 'What is the primary conclusion of the stimulus passage?',
            stimulus_text: 'Passage concerning social structures...',
            selected_option: 'A',
            correct_answer: 'A',
            is_correct: true,
            explanation: 'Option A is supported by paragraph 2.'
          },
          {
            id: 38002,
            question_id: 38002,
            question: 'Calculate the rate of reaction...',
            selected_option: null,
            correct_answer: 'B',
            is_correct: false,
            is_skipped: true,
            explanation: 'The slope at t=0 indicates 0.50 mol/s.'
          }
        ]
      }
    });

    expect(component.view()).toBe('result');
    expect(component.testResult()?.correct).toBe(1);
    expect(component.testResult()?.accuracy).toBe(50);
    expect(component.allReviewQuestions().length).toBe(2);

    // Test review filters
    component.setResultFilter('correct');
    expect(component.filteredReview().length).toBe(1);
    expect(component.filteredReview()[0].question_id).toBe(38001);

    component.setResultFilter('skipped');
    expect(component.filteredReview().length).toBe(1);
    expect(component.filteredReview()[0].question_id).toBe(38002);
  });

  it('9. should accurately calculate progress, prevent increments on answer change, and maintain progress across navigation', () => {
    fixture.detectChanges();

    const streakReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STREAK.BASE}`);
    streakReq.flush({ success: true, data: null });
    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({ success: true, data: mockPapers });

    component.onStartTest(mockPapers[0]);
    const startReq = httpTesting.expectOne(
      `${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}/${mockPapers[0].id}/start`
    );
    startReq.flush(mockStartResponse);

    // Initial: 0 / 2 answered => 0%
    expect(component.answeredCount()).toBe(0);
    expect(component.progressPercentage()).toBe(0);

    // Answer Q1: 1 / 2 answered => 50%
    component.selectOption('A');
    const autosave1 = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.SESSIONS}/gamsat-session-test-123`);
    autosave1.flush({ success: true });
    expect(component.answeredCount()).toBe(1);
    expect(component.progressPercentage()).toBe(50);

    // Change Q1 answer from A to B: still 1 / 2 answered => 50% (NOT 100%)
    component.selectOption('B');
    const autosave2 = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.SESSIONS}/gamsat-session-test-123`);
    autosave2.flush({ success: true });
    expect(component.answeredCount()).toBe(1);
    expect(component.progressPercentage()).toBe(50);

    // Navigate to Q2 without answering: still 50%
    component.nextQuestion();
    expect(component.currentQuestionIndex()).toBe(1);
    expect(component.answeredCount()).toBe(1);
    expect(component.progressPercentage()).toBe(50);

    // Navigate back to Q1: still 50%
    component.prevQuestion();
    expect(component.currentQuestionIndex()).toBe(0);
    expect(component.answeredCount()).toBe(1);
    expect(component.progressPercentage()).toBe(50);

    // Answer Q2: 2 / 2 answered => 100%
    component.jumpToQuestion(1);
    component.selectOption('D');
    const autosave3 = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.SESSIONS}/gamsat-session-test-123`);
    autosave3.flush({ success: true });
    expect(component.answeredCount()).toBe(2);
    expect(component.progressPercentage()).toBe(100);
  });

  it('10. should handle TEST_ALREADY_COMPLETED on autosave by stopping autosave and loading results', () => {
    fixture.detectChanges();

    const streakReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STREAK.BASE}`);
    streakReq.flush({ success: true, data: null });
    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({ success: true, data: mockPapers });

    component.onStartTest(mockPapers[0]);
    const startReq = httpTesting.expectOne(
      `${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}/${mockPapers[0].id}/start`
    );
    startReq.flush(mockStartResponse);

    // Select Option A and simulate backend returning TEST_ALREADY_COMPLETED
    component.selectOption('A');
    const autosaveReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.SESSIONS}/gamsat-session-test-123`);
    autosaveReq.flush(
      { success: false, error: { code: 'TEST_ALREADY_COMPLETED', message: 'Cannot modify answers for a completed test' } },
      { status: 400, statusText: 'Bad Request' }
    );

    // Should fetch test result and switch view to result
    const resultReq = httpTesting.expectOne(
      `${environment.gamsatApiBaseUrl}${API.TEST.SESSIONS}/gamsat-session-test-123/result`
    );
    resultReq.flush({ success: true, data: { sessionId: 'gamsat-session-test-123', correct: 1, total: 2, score: '1/2' } });

    expect(component.view()).toBe('result');
    expect(component.activeSession()?.status).toBe('COMPLETED');
  });

  it('11. should transition directly to results if resumeSession is called for a completed session', () => {
    fixture.detectChanges();

    const streakReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STREAK.BASE}`);
    streakReq.flush({ success: true, data: null });
    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({ success: true, data: mockPapers });

    // Call resumeSession with a completed session
    component.resumeSession('GAMSAT-PYQ-COMPLETED-123');

    const sessionReq = httpTesting.expectOne(
      `${environment.gamsatApiBaseUrl}${API.TEST.SESSIONS}/GAMSAT-PYQ-COMPLETED-123`
    );
    sessionReq.flush({
      success: true,
      data: {
        sessionId: 'GAMSAT-PYQ-COMPLETED-123',
        status: 'COMPLETED',
        questions: mockStartResponse.data.questions
      }
    });

    const resultReq = httpTesting.expectOne(
      `${environment.gamsatApiBaseUrl}${API.TEST.SESSIONS}/GAMSAT-PYQ-COMPLETED-123/result`
    );
    resultReq.flush({
      success: true,
      data: {
        sessionId: 'GAMSAT-PYQ-COMPLETED-123',
        correct: 2,
        total: 2,
        score: '2/2'
      }
    });

    expect(component.view()).toBe('result');
  });

  it('12. should preserve original activeSession sessionId when submit response omits sessionId', () => {
    fixture.detectChanges();

    const streakReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STREAK.BASE}`);
    streakReq.flush({ success: true, data: null });
    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({ success: true, data: mockPapers });

    component.onStartTest(mockPapers[0]);
    const startReq = httpTesting.expectOne(
      `${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}/${mockPapers[0].id}/start`
    );
    startReq.flush(mockStartResponse);

    component.selectOption('B');
    const autosaveReq = httpTesting.expectOne(
      `${environment.gamsatApiBaseUrl}${API.TEST.SESSIONS}/gamsat-session-test-123`
    );
    autosaveReq.flush({ success: true });

    component.onSubmitTest();

    const submitReq = httpTesting.expectOne(
      `${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.SUBMIT}`
    );
    // Submit response WITHOUT sessionId in data payload
    submitReq.flush({
      success: true,
      data: {
        score: '1 / 2',
        correct: 1,
        totalQuestions: 2,
        review: [
          {
            id: 38001,
            question_id: 38001,
            selected_option: 'B',
            correct_answer: 'B',
            is_correct: true
          }
        ]
      }
    });

    expect(component.view()).toBe('result');
    expect(component.testResult()?.sessionId).toBe('gamsat-session-test-123');
    expect(component.testResult()?.correct).toBe(1);
  });

  it('13. should handle result API failure with error banner and retry capability', () => {
    fixture.detectChanges();

    const streakReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STREAK.BASE}`);
    streakReq.flush({ success: true, data: null });
    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({ success: true, data: mockPapers });

    component.loadResult('GAMSAT-PYQ-ERROR-SESSION');

    expect(component.isLoadingResult()).toBe(true);

    const resultReq = httpTesting.expectOne(
      `${environment.gamsatApiBaseUrl}${API.TEST.SESSIONS}/GAMSAT-PYQ-ERROR-SESSION/result`
    );
    resultReq.flush(
      { success: false, message: 'Server error' },
      { status: 500, statusText: 'Internal Server Error' }
    );

    expect(component.isLoadingResult()).toBe(false);
    expect(component.errorMessage()).toBe('Unable to load the test result. Please try again.');
  });

  it('14. should not make HTTP request if loadResult is called with empty sessionId', () => {
    fixture.detectChanges();

    const streakReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STREAK.BASE}`);
    streakReq.flush({ success: true, data: null });
    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({ success: true, data: mockPapers });

    component.loadResult('');

    expect(component.isLoadingResult()).toBe(false);
    expect(component.errorMessage()).toBe('Test session ID is missing. The result cannot be loaded.');
  });
});
