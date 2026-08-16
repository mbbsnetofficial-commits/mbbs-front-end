import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { QuickTestService } from '../../services/quick-test.service';
import { QuickTest } from './quick-test';

describe('QuickTest', () => {
  let component: QuickTest;
  let fixture: ComponentFixture<QuickTest>;
  let service: {
    getSubjects: ReturnType<typeof vi.fn>;
    getChapters: ReturnType<typeof vi.fn>;
    getTopics: ReturnType<typeof vi.fn>;
    startTest: ReturnType<typeof vi.fn>;
    submitTest: ReturnType<typeof vi.fn>;
    getTestResult: ReturnType<typeof vi.fn>;
    listChatSessions: ReturnType<typeof vi.fn>;
    createChatSession: ReturnType<typeof vi.fn>;
    getChatMessages: ReturnType<typeof vi.fn>;
    sendChatMessage: ReturnType<typeof vi.fn>;
    generateInsights: ReturnType<typeof vi.fn>;
    getZoneInsights: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    sessionStorage.clear();
    service = {
      getSubjects: vi.fn().mockReturnValue(of({
        success: true,
        total: 4,
        data: ['Physics', 'Chemistry', 'Botany', 'Zoology']
      })),
      getChapters: vi.fn().mockReturnValue(of({
        success: true,
        total: 4,
        data: [
          { chapter: null },
          { chapter: 'Units and Measurements' },
          { chapter: 'Atoms' },
          { chapter: 'Atoms' }
        ]
      })),
      getTopics: vi.fn().mockReturnValue(of({
        success: true,
        total: 10,
        data: []
      })),
      startTest: vi.fn().mockReturnValue(of({
        success: true,
        sessionId: 'test-session',
        duration: 15,
        totalQuestions: 1,
        data: [{
          id: 1001,
          question: 'Sample question',
          option_a: 'First',
          option_b: 'Second',
          option_c: 'Third',
          option_d: 'Fourth',
          topic_id: 991
        }]
      })),
      submitTest: vi.fn().mockReturnValue(of({
        success: true,
        score: 3,
        correct: 1,
        wrong: 1,
        skipped: 0,
        accuracy: 50,
        review: []
      })),
      getTestResult: vi.fn().mockReturnValue(of({
        success: true,
        data: {
          sessionId: 'test-session',
          test_type: 'Quick Test',
          previous_year_paper_id: null,
          status: 'Completed',
          score: 3,
          correct: 1,
          wrong: 1,
          skipped: 0,
          accuracy: 50,
          total_questions: 2,
          duration: 900,
          started_at: '2026-07-25T09:12:00.000Z',
          submitted_at: '2026-07-25T09:13:00.000Z',
          total_time_spent: 60,
          review: [
            {
              id: 1001,
              question: 'Correct question',
              option_a: 'First',
              option_b: 'Second',
              option_c: 'Third',
              option_d: 'Fourth',
              topic_id: 991,
              correct_answer: 'B',
              explanation: 'Explanation',
              selected_option: 'B',
              is_correct: true,
              marks_awarded: 4,
              time_spent: 30,
              is_skipped: false
            },
            {
              id: 1002,
              question: 'Wrong question',
              option_a: 'First',
              option_b: 'Second',
              option_c: 'Third',
              option_d: 'Fourth',
              topic_id: 991,
              correct_answer: 'A',
              explanation: 'Explanation',
              selected_option: 'C',
              is_correct: false,
              marks_awarded: -1,
              time_spent: 30,
              is_skipped: false
            }
          ]
        }
      })),
      listChatSessions: vi.fn().mockReturnValue(of({
        status: 'success',
        page: 1,
        limit: 100,
        total: 1,
        totalPages: 1,
        data: [{
          _id: 'chat-1',
          user_id: 'user-1',
          test_session_id: 'test-session',
          title: 'My NEET Test Review',
          wrong_question_ids: [1002],
          is_active: true,
          last_message_at: '2026-07-25T09:13:00.000Z'
        }]
      })),
      createChatSession: vi.fn().mockReturnValue(of({
        status: 'success',
        data: {
          _id: 'chat-created',
          user_id: 'user-1',
          test_session_id: 'test-session',
          title: 'My NEET Test Review',
          wrong_question_ids: [1002],
          is_active: true,
          last_message_at: '2026-07-25T09:13:00.000Z'
        }
      })),
      getChatMessages: vi.fn().mockReturnValue(of({
        status: 'success',
        page: 1,
        limit: 100,
        total: 0,
        totalPages: 1,
        data: []
      })),
      sendChatMessage: vi.fn().mockReturnValue(of({
        status: 'success',
        data: {
          userMessage: {
            _id: 'msg-1',
            chat_session_id: 'chat-1',
            user_id: 'user-1',
            role: 'user',
            content: 'Explain why my answer was wrong',
            model: null,
            createdAt: '2026-07-25T09:14:00.000Z'
          },
          assistantMessage: {
            _id: 'msg-2',
            chat_session_id: 'chat-1',
            user_id: 'user-1',
            role: 'assistant',
            content: 'Option A is correct because...',
            model: 'gemini-1.5-flash',
            createdAt: '2026-07-25T09:14:02.000Z'
          }
        }
      })),
      generateInsights: vi.fn().mockReturnValue(of({
        status: 'success',
        message: 'Insights generated',
        data: {
          testSessionId: 'test-session',
          chatSessionId: 'chat-1',
          insight: {
            _id: 'insight-1',
            student_id: 'student-1',
            test_session_id: 'test-session',
            accuracy: 50,
            focus_zone: { Botany: ['Atoms'] },
            repeated_mistake: {},
            checkpoints: ['Revise formula sheet'],
            g_phrase: 'Solid effort, keep revising weak topics.',
            total_mark: 3,
            time_spend: {
              total_time_spent: 60,
              correct_time_spent: 30,
              incorrect_time_spent: 30,
              skipped_time_spent: 0
            }
          }
        }
      })),
      getZoneInsights: vi.fn().mockReturnValue(of({
        status: 'success',
        data: {
          _id: 'insight-1',
          student_id: 'student-1',
          test_session_id: 'test-session',
          accuracy: 50,
          focus_zone: { Botany: ['Atoms'] },
          repeated_mistake: {},
          checkpoints: ['Revise formula sheet'],
          g_phrase: 'Solid effort, keep revising weak topics.',
          total_mark: 3,
          time_spend: {
            total_time_spent: 60,
            correct_time_spent: 30,
            incorrect_time_spent: 30,
            skipped_time_spent: 0
          }
        }
      }))
    };

    await TestBed.configureTestingModule({
      imports: [QuickTest],
      providers: [
        provideRouter([]),
        { provide: QuickTestService, useValue: service }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(QuickTest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with subjects loaded in wizard step 1', () => {
    expect(component.view()).toBe('wizard');
    expect(component.step()).toBe(1);
    expect(component.subjects()).toEqual(['Physics', 'Chemistry', 'Botany', 'Zoology']);
  });

  it('should move to step 2 after confirming test name and load chapters on selecting subjects', () => {
    component.goToSubjects();
    expect(component.step()).toBe(2);

    component.toggleSubject('Physics');
    component.toggleSubject('Chemistry');
    expect(component.selectedSubjects()).toEqual(['Physics', 'Chemistry']);

    component.goToChapters();
    expect(service.getChapters).toHaveBeenCalledWith({
      subjects: ['Physics', 'Chemistry']
    });
    expect(component.step()).toBe(3);
    expect(component.chapters()).toEqual(['Atoms', 'Units and Measurements']);
  });

  it('should start test, run question timer and select options', () => {
    component.goToSubjects();
    component.toggleSubject('Physics');
    component.goToChapters();
    component.toggleChapter('Atoms');
    component.goToConfiguration();
    expect(component.step()).toBe(4);

    component.startTest();
    expect(service.startTest).toHaveBeenCalledWith({
      subjects: ['Physics'],
      chapters: ['Atoms'],
      questionCount: 15,
      duration: 15
    });

    expect(component.view()).toBe('test');
    expect(component.activeSession()?.sessionId).toBe('test-session');
    expect(component.currentQuestion()?.id).toBe(1001);

    component.selectOption('C');
    expect(component.currentQuestionState()?.selectedOption).toBe('C');
    expect(component.answeredCount()).toBe(1);
  });

  it('should submit test, transition to result view and load breakdown', () => {
    component.goToSubjects();
    component.toggleSubject('Physics');
    component.goToChapters();
    component.toggleChapter('Atoms');
    component.goToConfiguration();
    component.startTest();

    component.selectOption('C');
    component.submitTest();

    expect(service.submitTest).toHaveBeenCalledWith({
      sessionId: 'test-session',
      answers: [{
        question_id: 1001,
        selected_option: 'C',
        time_spent: 0
      }]
    });

    expect(component.view()).toBe('result');
    expect(service.getTestResult).toHaveBeenCalledWith('test-session');
    expect(component.testResult()?.score).toBe(3);
  });
});
