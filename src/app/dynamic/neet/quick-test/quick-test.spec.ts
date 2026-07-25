import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { QuickTestService } from '../../../core/serivce/quick-test.service';
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
              time_spent: 20,
              is_skipped: false
            },
            {
              id: 1002,
              question: 'Wrong question',
              option_a: 'First',
              option_b: 'Second',
              option_c: 'Third',
              option_d: 'Fourth',
              topic_id: 992,
              correct_answer: 'D',
              explanation: 'Explanation',
              selected_option: 'C',
              is_correct: false,
              marks_awarded: -1,
              time_spent: 40,
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
          _id: 'chat-session',
          user_id: 'user',
          test_session_id: 'test-session',
          title: 'My NEET Test Review',
          wrong_question_ids: [1002],
          is_active: true,
          last_message_at: '2026-07-25T10:40:00.000Z'
        }]
      })),
      createChatSession: vi.fn().mockReturnValue(of({
        status: 'success',
        data: {
          _id: 'created-chat',
          user_id: 'user',
          test_session_id: 'test-session',
          title: 'My NEET Test Review',
          wrong_question_ids: [1002],
          is_active: true,
          last_message_at: '2026-07-25T10:40:00.000Z'
        }
      })),
      getChatMessages: vi.fn().mockReturnValue(of({
        status: 'success',
        page: 1,
        limit: 100,
        total: 0,
        totalPages: 0,
        data: []
      })),
      sendChatMessage: vi.fn().mockReturnValue(of({
        status: 'success',
        data: {
          userMessage: {
            _id: 'user-message',
            chat_session_id: 'chat-session',
            user_id: 'user',
            role: 'user',
            content: 'Explain question 1002',
            model: null,
            createdAt: '2026-07-25T10:45:00.000Z'
          },
          assistantMessage: {
            _id: 'assistant-message',
            chat_session_id: 'chat-session',
            user_id: 'user',
            role: 'assistant',
            content: 'Gemini explanation',
            model: 'gemini-3.5-flash',
            createdAt: '2026-07-25T10:45:02.000Z'
          }
        }
      })),
      generateInsights: vi.fn().mockReturnValue(of({
        status: 'success',
        message: 'Insights generated',
        data: {
          testSessionId: 'test-session',
          chatSessionId: 'chat-session',
          insight: {}
        }
      })),
      getZoneInsights: vi.fn().mockReturnValue(of({
        status: 'success',
        data: {
          _id: 'insight',
          student_id: 'student',
          test_session_id: 'test-session',
          accuracy: 50,
          focus_zone: {
            Physics: ['Revise current electricity.']
          },
          repeated_mistake: {
            Physics: ['Check units before applying formulas.']
          },
          checkpoints: ['Practice 20 questions.'],
          g_phrase: 'Focused revision builds success.',
          total_mark: 3,
          time_spend: {
            total_time_spent: 60,
            correct_time_spent: 20,
            incorrect_time_spent: 40,
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuickTest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    sessionStorage.clear();
  });

  it('loads the available subjects', () => {
    expect(service.getSubjects).toHaveBeenCalledOnce();
    expect(component.subjects()).toEqual([
      'Physics',
      'Chemistry',
      'Botany',
      'Zoology'
    ]);
  });

  it('loads unique non-null chapters for selected subjects', () => {
    component.toggleSubject('Physics');
    component.goToChapters();

    expect(service.getChapters).toHaveBeenCalledWith({
      subjects: ['Physics']
    });
    expect(component.chapters()).toEqual([
      'Atoms',
      'Units and Measurements'
    ]);
    expect(component.step()).toBe(2);
  });

  it('loads the topic pool before configuration', () => {
    component.selectedSubjects.set(['Physics']);
    component.selectedChapters.set(['Units and Measurements']);
    component.goToConfiguration();

    expect(service.getTopics).toHaveBeenCalledWith({
      subjects: ['Physics'],
      chapters: ['Units and Measurements']
    });
    expect(component.topicCount()).toBe(10);
    expect(component.step()).toBe(3);
  });

  it('starts a test and records an answer', () => {
    component.selectedSubjects.set(['Physics']);
    component.selectedChapters.set(['Units and Measurements']);
    component.startTest();
    component.selectOption('B');

    expect(service.startTest).toHaveBeenCalledWith({
      subjects: ['Physics'],
      chapters: ['Units and Measurements'],
      questionCount: 15,
      duration: 15
    });
    expect(component.view()).toBe('test');
    expect(component.currentQuestionState()?.selectedOption).toBe('B');
    expect(sessionStorage.getItem('activeQuickTest')).toBeTruthy();
  });

  it('submits answered questions with the session id', () => {
    component.selectedSubjects.set(['Physics']);
    component.selectedChapters.set(['Units and Measurements']);
    component.startTest();
    component.selectOption('B');
    component.submitTest(false);

    expect(service.submitTest).toHaveBeenCalledWith({
      sessionId: 'test-session',
      answers: [{
        question_id: 1001,
        selected_option: 'B',
        time_spent: 0
      }]
    });
    expect(service.getTestResult).toHaveBeenCalledWith('test-session');
    expect(component.view()).toBe('result');
    expect(component.testResult()?.score).toBe(3);
    expect(sessionStorage.getItem('activeQuickTest')).toBeNull();
  });

  it('filters wrong answers separately from skipped answers', () => {
    component.loadResult('test-session');
    component.setResultFilter('wrong');

    expect(component.filteredReview()).toHaveLength(1);
    expect(component.filteredReview()[0].id).toBe(1002);
  });

  it('reuses the test chat and loads its message history', () => {
    component.loadResult('test-session');
    component.openChat(1002);

    expect(service.listChatSessions).toHaveBeenCalledWith(1, 100);
    expect(service.createChatSession).not.toHaveBeenCalled();
    expect(service.getChatMessages).toHaveBeenCalledWith(
      'chat-session',
      1,
      100
    );
    expect(component.chatSession()?._id).toBe('chat-session');
    expect(component.chatInput()).toContain('1002');
  });

  it('sends a Gemini message and appends both messages', () => {
    component.loadResult('test-session');
    component.openChat();
    component.chatInput.set('Explain question 1002');
    component.sendMessage();

    expect(service.sendChatMessage).toHaveBeenCalledWith(
      'chat-session',
      'Explain question 1002'
    );
    expect(component.chatMessages()).toHaveLength(2);
    expect(component.chatMessages()[1].role).toBe('assistant');
  });

  it('loads stored subject-zone insights for the completed test', () => {
    component.loadResult('test-session');
    component.openInsights();

    expect(service.getZoneInsights).toHaveBeenCalledWith('test-session');
    expect(component.zoneInsight()?.focus_zone['Physics']).toEqual([
      'Revise current electricity.'
    ]);
  });

  it('generates insights when no stored insight exists yet', () => {
    const storedInsightResponse = of({
      status: 'success',
      data: {
        student_id: 'student',
        test_session_id: 'test-session',
        accuracy: 50,
        focus_zone: { Physics: ['Revise current electricity.'] },
        repeated_mistake: { Physics: ['Check units.'] },
        checkpoints: ['Practice 20 questions.'],
        g_phrase: 'Focused revision builds success.',
        total_mark: 3,
        time_spend: {
          total_time_spent: 60,
          correct_time_spent: 20,
          incorrect_time_spent: 40,
          skipped_time_spent: 0
        }
      }
    });
    service.getZoneInsights.mockReset();
    service.getZoneInsights
      .mockReturnValueOnce(throwError(() => ({ status: 404 })))
      .mockReturnValueOnce(storedInsightResponse);

    component.loadResult('test-session');
    component.openInsights();

    expect(service.generateInsights).toHaveBeenCalledWith('chat-session');
    expect(service.getZoneInsights).toHaveBeenCalledTimes(2);
    expect(component.zoneInsight()?.test_session_id).toBe('test-session');
  });
});
