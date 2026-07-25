import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PreviousYearTestService } from '../../../core/serivce/previous-year-test.service';
import { QuickTestService } from '../../../core/serivce/quick-test.service';
import { PreviousYearQuestions } from './previous-year-questions';

describe('PreviousYearQuestions', () => {
  let component: PreviousYearQuestions;
  let fixture: ComponentFixture<PreviousYearQuestions>;
  let service: {
    getPapers: ReturnType<typeof vi.fn>;
    getPaper: ReturnType<typeof vi.fn>;
    startTest: ReturnType<typeof vi.fn>;
    submitTest: ReturnType<typeof vi.fn>;
  };
  let chatService: {
    listChatSessions: ReturnType<typeof vi.fn>;
    createChatSession: ReturnType<typeof vi.fn>;
    getChatMessages: ReturnType<typeof vi.fn>;
    sendChatMessage: ReturnType<typeof vi.fn>;
    generateInsights: ReturnType<typeof vi.fn>;
    getZoneInsights: ReturnType<typeof vi.fn>;
  };

  const paper = {
    id: 15,
    name: 'NEET_2022',
    uploaded_at: '2026-03-11T18:17:59.279Z',
    source_filename: 'NEET_2022.xlsx',
    question_count: 200,
    exam_type: 'neet',
    is_active: true,
    institution_id: 25,
    mapped_question_count: 200,
    mapping_available: true
  };

  beforeEach(async () => {
    sessionStorage.clear();
    service = {
      getPapers: vi.fn().mockReturnValue(of({
        success: true,
        total: 2,
        data: [
          paper,
          {
            ...paper,
            id: 17,
            name: 'NEET_2024',
            mapped_question_count: 0,
            mapping_available: false
          }
        ]
      })),
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
      submitTest: vi.fn().mockReturnValue(of({
        success: true,
        score: -1,
        correct: 0,
        wrong: 1,
        skipped: 1,
        accuracy: 0,
        review: [{
          question_id: 19018,
          selected: 'B',
          correct_answer: 'D',
          isCorrect: false
        }]
      }))
    };
    chatService = {
      listChatSessions: vi.fn().mockReturnValue(of({
        status: 'success',
        page: 1,
        limit: 100,
        total: 1,
        totalPages: 1,
        data: [{
          _id: 'paper-chat',
          user_id: 'user',
          test_session_id: 'previous-session',
          title: 'NEET_2022 Review',
          wrong_question_ids: [19018],
          is_active: true,
          last_message_at: '2026-07-25T10:40:00.000Z'
        }]
      })),
      createChatSession: vi.fn().mockReturnValue(of({
        status: 'success',
        data: {
          _id: 'created-paper-chat',
          user_id: 'user',
          test_session_id: 'previous-session',
          title: 'NEET_2022 Review',
          wrong_question_ids: [19018],
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
            chat_session_id: 'paper-chat',
            user_id: 'user',
            role: 'user',
            content: 'Explain question 19018',
            model: null,
            createdAt: '2026-07-25T10:45:00.000Z'
          },
          assistantMessage: {
            _id: 'assistant-message',
            chat_session_id: 'paper-chat',
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
          testSessionId: 'previous-session',
          chatSessionId: 'paper-chat',
          insight: {}
        }
      })),
      getZoneInsights: vi.fn().mockReturnValue(of({
        status: 'success',
        data: {
          student_id: 'student',
          test_session_id: 'previous-session',
          accuracy: 0,
          focus_zone: {
            Physics: ['Revise the weak concept.']
          },
          repeated_mistake: {
            Physics: ['Check the formula before answering.']
          },
          checkpoints: ['Practise similar questions.'],
          g_phrase: 'Every reviewed mistake builds mastery.',
          total_mark: -1,
          time_spend: {
            total_time_spent: 18,
            correct_time_spent: 0,
            incorrect_time_spent: 18,
            skipped_time_spent: 0
          }
        }
      }))
    };

    await TestBed.configureTestingModule({
      imports: [PreviousYearQuestions],
      providers: [
        provideRouter([]),
        { provide: PreviousYearTestService, useValue: service },
        { provide: QuickTestService, useValue: chatService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PreviousYearQuestions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    sessionStorage.clear();
  });

  it('loads NEET papers and counts only mapped active papers', () => {
    expect(service.getPapers).toHaveBeenCalledWith('neet');
    expect(component.papers()).toHaveLength(2);
    expect(component.availablePaperCount()).toBe(1);
  });

  it('loads the selected paper before configuration', () => {
    component.selectPaper(paper);

    expect(service.getPaper).toHaveBeenCalledWith(15);
    expect(component.selectedPaper()?.id).toBe(15);
    expect(component.duration()).toBe(200);
    expect(component.view()).toBe('configure');
  });

  it('does not select a paper without question mapping', () => {
    component.selectPaper({
      ...paper,
      mapped_question_count: 0,
      mapping_available: false
    });

    expect(service.getPaper).not.toHaveBeenCalled();
    expect(component.view()).toBe('papers');
  });

  it('starts the selected paper and saves the active session', () => {
    component.selectPaper(paper);
    component.startTest();

    expect(service.startTest).toHaveBeenCalledWith(15, {
      duration: 200
    });
    expect(component.view()).toBe('test');
    expect(component.currentQuestion()?.id).toBe(19018);
    expect(sessionStorage.getItem('activePreviousYearTest')).toBeTruthy();
  });

  it('submits only answered questions and shows the immediate result', () => {
    component.selectPaper(paper);
    component.startTest();
    component.selectOption('B');
    component.submitTest(false);

    expect(service.submitTest).toHaveBeenCalledWith({
      sessionId: 'previous-session',
      answers: [{
        question_id: 19018,
        selected_option: 'B',
        time_spent: 0
      }]
    });
    expect(component.view()).toBe('result');
    expect(component.result()?.score).toBe(-1);
    expect(component.reviewedQuestions()[0].question.id).toBe(19018);
    expect(sessionStorage.getItem('activePreviousYearTest')).toBeNull();
    expect(sessionStorage.getItem('completedPreviousYearTest')).toBeTruthy();
  });

  it('filters incorrect reviewed answers', () => {
    component.selectPaper(paper);
    component.startTest();
    component.selectOption('B');
    component.submitTest(false);
    component.setResultFilter('wrong');

    expect(component.filteredReview()).toHaveLength(1);
    expect(component.filteredReview()[0].result.correct_answer).toBe('D');
  });

  it('reuses a chat session and loads its message history', () => {
    completeWrongAnswer();
    component.openChat(19018);

    expect(chatService.listChatSessions).toHaveBeenCalledWith(1, 100);
    expect(chatService.createChatSession).not.toHaveBeenCalled();
    expect(chatService.getChatMessages).toHaveBeenCalledWith(
      'paper-chat',
      1,
      100
    );
    expect(component.chatInput()).toContain('19018');
  });

  it('sends a Gemini question and appends the response', () => {
    completeWrongAnswer();
    component.openChat();
    component.chatInput.set('Explain question 19018');
    component.sendMessage();

    expect(chatService.sendChatMessage).toHaveBeenCalledWith(
      'paper-chat',
      'Explain question 19018'
    );
    expect(component.chatMessages()).toHaveLength(2);
    expect(component.chatMessages()[1].role).toBe('assistant');
  });

  it('loads stored insights for the previous year test session', () => {
    completeWrongAnswer();
    component.openInsights();

    expect(chatService.getZoneInsights).toHaveBeenCalledWith(
      'previous-session'
    );
    expect(component.zoneInsight()?.focus_zone['Physics']).toEqual([
      'Revise the weak concept.'
    ]);
  });

  it('generates insights when the session has no stored insight', () => {
    chatService.getZoneInsights.mockReset();
    chatService.getZoneInsights
      .mockReturnValueOnce(throwError(() => ({ status: 404 })))
      .mockReturnValueOnce(of({
        status: 'success',
        data: {
          student_id: 'student',
          test_session_id: 'previous-session',
          accuracy: 0,
          focus_zone: { Physics: ['Revise the weak concept.'] },
          repeated_mistake: { Physics: ['Check the formula.'] },
          checkpoints: ['Practise again.'],
          g_phrase: 'Keep learning.',
          total_mark: -1,
          time_spend: {
            total_time_spent: 18,
            correct_time_spent: 0,
            incorrect_time_spent: 18,
            skipped_time_spent: 0
          }
        }
      }));

    completeWrongAnswer();
    component.openInsights();

    expect(chatService.generateInsights).toHaveBeenCalledWith('paper-chat');
    expect(chatService.getZoneInsights).toHaveBeenCalledTimes(2);
    expect(component.zoneInsight()?.test_session_id).toBe('previous-session');
  });

  function completeWrongAnswer(): void {
    component.selectPaper(paper);
    component.startTest();
    component.selectOption('B');
    component.submitTest(false);
  }
});
