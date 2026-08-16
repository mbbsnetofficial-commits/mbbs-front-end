import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { PreviousYearTestService } from '../../services/previous-year.service';
import { PreviousYear } from './previous-year';

describe('PreviousYear', () => {
  let component: PreviousYear;
  let fixture: ComponentFixture<PreviousYear>;
  let service: {
    getBuiltinTests: ReturnType<typeof vi.fn>;
    getPapers: ReturnType<typeof vi.fn>;
    getPaper: ReturnType<typeof vi.fn>;
    startTest: ReturnType<typeof vi.fn>;
    saveAnswer: ReturnType<typeof vi.fn>;
    submitTest: ReturnType<typeof vi.fn>;
  };

  const paper = {
    id: 1001,
    test_id: 1001,
    builtin_test_id: 1001,
    test_code: 'NEET_BUILTIN_PHY_01',
    test_name: 'Physics Full Test',
    test_type: 'Built-in Full Test',
    source: 'builtin' as const,
    subject: 'Physics',
    total_questions: 180,
    total_marks: 720,
    duration_minutes: 180,
    marking_scheme: {
      correct: 4,
      wrong: -1,
      skipped: 0
    },
    description: '180-Question Physics Full Test for NEET',
    is_active: true
  };

  beforeEach(async () => {
    sessionStorage.clear();
    const testsResponse = {
      success: true,
      total: 2,
      data: [
        paper,
        {
          ...paper,
          id: 101,
          test_id: 101,
          previous_year_paper_id: 101,
          test_code: 'NEET_PY_101',
          test_name: 'NEET 2024 Question Paper',
          test_type: 'Previous Year Test',
          source: 'previous_year' as const,
          subject: 'All',
          description: 'NEET Previous Year Paper: NEET 2024 Question Paper',
          total_questions: 0,
          is_active: false
        }
      ]
    };

    service = {
      getBuiltinTests: vi.fn().mockReturnValue(of(testsResponse)),
      getPapers: vi.fn().mockReturnValue(of(testsResponse)),
      getPaper: vi.fn().mockReturnValue(of({
        success: true,
        data: paper
      })),
      startTest: vi.fn().mockReturnValue(of({
        success: true,
        sessionId: 'previous-session',
        paper: {
          id: 15,
          name: 'NEET_2022',
          exam_type: 'neet'
        },
        duration: 200,
        totalQuestions: 2,
        data: [
          {
            id: 19018,
            question: 'Sample previous year question',
            option_a: 'First',
            option_b: 'Second',
            option_c: 'Third',
            option_d: 'Fourth',
            topic_id: 10,
            exam_type: 'neet',
            institution_test_name: 'NEET_2022',
            institution_id: 25
          },
          {
            id: 19019,
            question: 'Second previous year question',
            option_a: 'One',
            option_b: 'Two',
            option_c: 'Three',
            option_d: 'Four',
            topic_id: 11
          }
        ]
      })),
      saveAnswer: vi.fn().mockReturnValue(of({ success: true, message: 'Answer saved' })),
      submitTest: vi.fn().mockReturnValue(of({
        success: true,
        score: -1,
        correct: 0,
        wrong: 1,
        skipped: 1,
        accuracy: 0,
        review: [
          {
            question_id: 19018,
            selected: 'C',
            correct_answer: 'A',
            isCorrect: false
          }
        ]
      }))
    };

    await TestBed.configureTestingModule({
      imports: [PreviousYear],
      providers: [
        provideRouter([]),
        { provide: PreviousYearTestService, useValue: service }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PreviousYear);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load previous year papers', () => {
    expect(component.view()).toBe('papers');
    expect(component.papers().length).toBe(2);
    expect(component.availablePaperCount()).toBe(1);
    expect(service.getBuiltinTests).toHaveBeenCalled();
  });

  it('should allow paper selection and opening configure view', () => {
    component.selectPaper(paper);

    expect(component.view()).toBe('configure');
    expect(component.selectedPaper()?.id).toBe(1001);
    expect(component.duration()).toBe(180);
  });

  it('should start test session and transition to test view', () => {
    component.selectPaper(paper);
    component.startTest();

    expect(service.startTest).toHaveBeenCalledWith({ builtin_test_id: 1001 });
    expect(component.view()).toBe('test');
    expect(component.activeSession()?.sessionId).toBe('previous-session');
    expect(component.currentQuestion()?.id).toBe(19018);
  });

  it('should start test with previous_year_paper_id for previous year papers', () => {
    const pyPaper = {
      ...paper,
      id: 101,
      test_id: 101,
      builtin_test_id: undefined,
      previous_year_paper_id: 101,
      source: 'previous_year' as const,
      is_active: true
    };
    component.selectPaper(pyPaper);
    component.startTest();

    expect(service.startTest).toHaveBeenCalledWith({ previous_year_paper_id: 101 });
  });

  it('should submit test and render result summary and answer review', () => {
    component.selectPaper(paper);
    component.startTest();

    component.selectOption('C');
    component.submitTest();

    expect(service.submitTest).toHaveBeenCalledWith({
      sessionId: 'previous-session',
      answers: [{
        question_id: 19018,
        selected_option: 'C',
        time_spent: 0
      }]
    });

    expect(component.view()).toBe('result');
    expect(component.result()?.score).toBe(-1);
    expect(component.reviewedQuestions().length).toBe(1);
  });

  it('should trigger saveAnswer on selectOption with sessionId, questionId, and option', () => {
    component.selectPaper(paper);
    component.startTest();

    component.selectOption('B');

    expect(service.saveAnswer).toHaveBeenCalledWith('previous-session', {
      question_id: 19018,
      selected_option: 'B',
      time_spent: 0
    });
    expect(component.currentQuestionState()?.selectedOption).toBe('B');
    expect(component.autosaveStatus()).toBe('saved');
  });

  it('should not call saveAnswer repeatedly if same option is selected', () => {
    component.selectPaper(paper);
    component.startTest();

    component.selectOption('B');
    expect(service.saveAnswer).toHaveBeenCalledTimes(1);

    component.selectOption('B');
    expect(service.saveAnswer).toHaveBeenCalledTimes(1);
  });

  it('should trigger saveAnswer when changing option selection', () => {
    component.selectPaper(paper);
    component.startTest();

    component.selectOption('A');
    expect(service.saveAnswer).toHaveBeenCalledWith('previous-session', {
      question_id: 19018,
      selected_option: 'A',
      time_spent: 0
    });

    component.selectOption('D');
    expect(service.saveAnswer).toHaveBeenCalledWith('previous-session', {
      question_id: 19018,
      selected_option: 'D',
      time_spent: 0
    });
    expect(component.currentQuestionState()?.selectedOption).toBe('D');
  });

  it('should trigger saveAnswer on clearResponse with null option', () => {
    component.selectPaper(paper);
    component.startTest();

    component.selectOption('A');
    component.clearResponse();

    expect(service.saveAnswer).toHaveBeenCalledWith('previous-session', {
      question_id: 19018,
      selected_option: null,
      time_spent: 0
    });
    expect(component.currentQuestionState()?.selectedOption).toBeNull();
  });

  it('should handle saveAnswer error gracefully without reverting local selection', () => {
    service.saveAnswer.mockReturnValue(throwError(() => new Error('Network error')));
    component.selectPaper(paper);
    component.startTest();

    component.selectOption('C');

    expect(component.currentQuestionState()?.selectedOption).toBe('C');
    expect(component.autosaveStatus()).toBe('error');
    expect(component.autosaveError()).toBe('Network error');
  });

  it('should save answers independently across different questions', () => {
    component.selectPaper(paper);
    component.startTest();

    component.selectOption('A');
    expect(service.saveAnswer).toHaveBeenCalledWith('previous-session', {
      question_id: 19018,
      selected_option: 'A',
      time_spent: 0
    });

    component.nextQuestion();
    expect(component.currentQuestion()?.id).toBe(19019);

    component.selectOption('D');
    expect(service.saveAnswer).toHaveBeenCalledWith('previous-session', {
      question_id: 19019,
      selected_option: 'D',
      time_spent: 0
    });

    expect(component.questionStates()[0].selectedOption).toBe('A');
    expect(component.questionStates()[1].selectedOption).toBe('D');
  });

  it('should NOT call submitTest on component initialization or session restoration with 0 remaining time', () => {
    expect(service.submitTest).not.toHaveBeenCalled();

    const expiredSession = {
      sessionId: 'expired-session',
      paper: { id: 1001, name: 'Physics Full Test', exam_type: 'neet' },
      duration: 180,
      totalQuestions: 1,
      startedAt: Date.now() - 200 * 60 * 1000,
      expiresAt: Date.now() - 20 * 60 * 1000,
      questions: [{ id: 19018, question: 'Sample Q', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D' }],
      questionStates: [{ questionId: 19018, selectedOption: null, timeSpent: 0, markedForReview: false, visited: true }],
      currentQuestionIndex: 0
    };
    sessionStorage.setItem('activePreviousYearTest', JSON.stringify(expiredSession));

    const newFixture = TestBed.createComponent(PreviousYear);
    const newComp = newFixture.componentInstance;
    newFixture.detectChanges();

    expect(service.submitTest).not.toHaveBeenCalled();
    expect(newComp.view()).toBe('test');
    expect(newComp.remainingSeconds()).toBe(0);
  });

  it('should NOT call submitTest when answering questions or navigating', () => {
    component.selectPaper(paper);
    component.startTest();

    expect(service.submitTest).not.toHaveBeenCalled();

    component.selectOption('B');
    expect(service.submitTest).not.toHaveBeenCalled();

    component.nextQuestion();
    expect(service.submitTest).not.toHaveBeenCalled();

    component.previousQuestion();
    expect(service.submitTest).not.toHaveBeenCalled();

    component.toggleMarkForReview();
    expect(service.submitTest).not.toHaveBeenCalled();
  });

  it('should prevent duplicate submission requests when submission is in flight', () => {
    const pending$ = new Subject<any>();
    service.submitTest.mockReturnValue(pending$);

    component.selectPaper(paper);
    component.startTest();

    component.selectOption('A');

    component.submitTest();
    expect(service.submitTest).toHaveBeenCalledTimes(1);
    expect(component.isSubmitting()).toBe(true);

    component.submitTest();
    expect(service.submitTest).toHaveBeenCalledTimes(1);

    pending$.next({ success: true, score: 100, accuracy: 100, correct: 1, wrong: 0, skipped: 0, review: [] });
    pending$.complete();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should safely parse nested data and fallback accuracy when submitted', () => {
    service.submitTest.mockReturnValue(of({
      success: true,
      data: {
        score: 650,
        correct: 162,
        wrong: 10,
        skipped: 8,
        percentage: 90
      }
    }));

    component.selectPaper(paper);
    component.startTest();
    component.selectOption('A');
    component.submitTest();

    expect(component.view()).toBe('result');
    expect(component.result()?.score).toBe(650);
    expect(component.result()?.accuracy).toBe(90);
    expect(component.result()?.correct).toBe(162);
  });

  it('should display error message and allow retry if submit fails', () => {
    service.submitTest.mockReturnValue(throwError(() => new Error('Submit failed')));

    component.selectPaper(paper);
    component.startTest();
    component.selectOption('A');
    component.submitTest();

    expect(component.view()).toBe('test');
    expect(component.errorMessage()).toBe('Submit failed');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should clear session and navigate to /dynamic/neet on backToLearningReport()', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.selectPaper(paper);
    component.startTest();
    component.selectOption('A');
    component.submitTest();

    expect(component.view()).toBe('result');

    component.backToLearningReport();

    expect(sessionStorage.getItem('activePreviousYearTest')).toBeNull();
    expect(sessionStorage.getItem('completedPreviousYearTest')).toBeNull();
    expect(component.activeSession()).toBeNull();
    expect(component.result()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/dynamic/neet']);
  });
});
