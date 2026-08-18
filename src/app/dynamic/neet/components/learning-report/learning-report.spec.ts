import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LearningReport } from './learning-report';
import { LearningReportService } from '../../services/learning-report.service';
import { PreviousYearTestService } from '../../services/previous-year.service';
import {
  LearningReportItem,
  LearningReportResponse,
  NeetSummaryResponse
} from '../../models/learning-report.model';

describe('LearningReport', () => {
  let component: LearningReport;
  let fixture: ComponentFixture<LearningReport>;
  let service: {
    getLearningReport: ReturnType<typeof vi.fn>;
    getNeetSummary: ReturnType<typeof vi.fn>;
  };
  let testService: {
    startTest: ReturnType<typeof vi.fn>;
    getTestSession: ReturnType<typeof vi.fn>;
  };

  const sampleReportItem: LearningReportItem = {
    id: 1001,
    test_id: 1001,
    test_code: 'NEET_BUILTIN_PHY_01',
    test_name: 'Physics Full Test',
    course_name: {
      title: 'Physics Full Test',
      subtitle: 'Physics Practice'
    },
    source: 'builtin',
    type: 'Physics',
    level: 'Intermediate',
    duration_minutes: 180,
    total_questions: 180,
    total_marks: 720,
    totalMarks: 720,
    status: 'completed',
    progress: 100,
    time_spent: '13h 7m',
    timeSpentSeconds: 47220,
    score: {
      earned: 580,
      total_marks: 720,
      formatted: '580 / 720'
    },
    activeSessionId: null,
    lastModifiedAt: '2026-08-16T00:00:00.000Z',
    date_modified: '16 Aug 2026'
  };

  const page1Response: LearningReportResponse = {
    status: 'success',
    message: 'NEET learning report fetched successfully.',
    data: [
      sampleReportItem,
      {
        ...sampleReportItem,
        id: 1003,
        test_id: 1003,
        test_code: 'NEET_BUILTIN_BOT_01',
        test_name: 'Botany Full Test',
        status: 'not_started',
        progress: 0,
        score: null
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1
    }
  };

  const page2Response: LearningReportResponse = {
    status: 'success',
    message: 'NEET learning report fetched successfully.',
    data: [
      {
        ...sampleReportItem,
        id: 1002,
        test_id: 1002,
        test_code: 'NEET_BUILTIN_CHEM_01',
        test_name: 'Chemistry Full Test',
        course_name: {
          title: 'Chemistry Full Test',
          subtitle: 'Chemistry Practice'
        },
        type: 'Chemistry'
      }
    ],
    pagination: {
      page: 2,
      limit: 10,
      total: 2,
      totalPages: 2
    }
  };

  const mockSummaryResponse: NeetSummaryResponse = {
    status: 'success',
    message: 'NEET dashboard summary fetched successfully.',
    data: {
      student_id: 'STU123456',
      total_time_spent_seconds: 163260,
      total_time_spent: '45h 21m',
      average_score: '590 / 720',
      average_score_number: 590,
      completed_tests: 13,
      current_streak: 14,
      streak_formatted: '14 Days',
      build_test_cta: 'Build your own test'
    }
  };

  beforeEach(async () => {
    sessionStorage.clear();
    service = {
      getLearningReport: vi.fn().mockReturnValue(of(page1Response)),
      getNeetSummary: vi.fn().mockReturnValue(of(mockSummaryResponse))
    };
    testService = {
      startTest: vi.fn().mockReturnValue(of({
        success: true,
        sessionId: 'session-12345',
        duration: 180,
        totalQuestions: 180,
        totalMarks: 720,
        title: 'Botany Full Test',
        subtitle: 'Botany Practice',
        level: 'Intermediate',
        data: [{ id: 1, question: 'Sample Q', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D' }]
      })),
      getTestSession: vi.fn().mockReturnValue(of({
        success: true,
        data: {
          sessionId: 'session-active-999',
          student_id: 'STU123456',
          title: 'Physics Full Test',
          status: 'Started',
          duration: 180,
          total_questions: 180,
          total_marks: 720,
          progress: 78,
          time_spent_seconds: 47220,
          remaining_time_seconds: 6080,
          answers: [
            {
              question_id: 1001,
              selected_option: 'B',
              time_spent: 35
            }
          ],
          questions: [
            {
              id: 1001,
              question: 'A particle moves along a straight line with velocity v = 3t^2 + 2t.',
              option_a: '12 m/s^2',
              option_b: '14 m/s^2',
              option_c: '16 m/s^2',
              option_d: '10 m/s^2',
              difficulty: 'Medium',
              topic_id: 12
            }
          ]
        }
      }))
    };

    await TestBed.configureTestingModule({
      imports: [LearningReport],
      providers: [
        provideRouter([
          { path: 'dynamic/neet/previous-year-tests', component: LearningReport }
        ]),
        { provide: LearningReportService, useValue: service },
        { provide: PreviousYearTestService, useValue: testService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LearningReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }, 30000);

  it('should call getNeetSummary and bind KPI summary on init', () => {
    expect(service.getNeetSummary).toHaveBeenCalled();
    expect(component.summary()).toEqual(mockSummaryResponse.data);

    const compiled = fixture.nativeElement as HTMLElement;
    const statValues = compiled.querySelectorAll('.stat-value');
    expect(statValues.length).toBe(4);
    expect(statValues[0].textContent?.trim()).toBe('45h 21m');
    expect(statValues[1].textContent?.trim()).toBe('590 / 720');
    expect(statValues[2].textContent?.trim()).toBe('13');
    expect(statValues[3].textContent?.trim()).toBe('14 Days');
  });

  it('should handle summary API failure gracefully without fake fallback', () => {
    service.getNeetSummary.mockReturnValue(throwError(() => new Error('Server Error')));
    component.loadSummary();
    fixture.detectChanges();

    expect(component.summaryError()).toBe('Server Error');
    expect(component.summary()).toBeNull();
  });

  it('should create and load initial batch (page 1) on init', () => {
    expect(component).toBeTruthy();
    expect(service.getLearningReport).toHaveBeenCalledWith({
      status: undefined,
      type: undefined,
      sortBy: 'date',
      sortOrder: 'desc',
      page: 1,
      limit: 10
    });
    expect(component.courses().length).toBe(2);
    expect(component.courses()[0].title).toBe('Physics Full Test');
    expect(component.courses()[0].score).toBe('580 / 720');
    expect(component.courses()[0].status).toBe('Completed');
    expect(component.courses()[0].progressPercent).toBe(100);
    expect(component.currentPage()).toBe(1);
  });

  it('should request filtered data and reset to page 1 when tab is changed', () => {
    component.setTab('completed');

    expect(service.getLearningReport).toHaveBeenCalledWith({
      status: 'completed',
      type: undefined,
      sortBy: 'date',
      sortOrder: 'desc',
      page: 1,
      limit: 10
    });
    expect(component.activeTab()).toBe('completed');
    expect(component.currentPage()).toBe(1);
  });

  it('should request sorted data and reset to page 1 when sort header is toggled', () => {
    component.toggleSort('score');

    expect(service.getLearningReport).toHaveBeenCalledWith({
      status: undefined,
      type: undefined,
      sortBy: 'score',
      sortOrder: 'desc',
      page: 1,
      limit: 10
    });
    expect(component.sortField()).toBe('score');
    expect(component.currentPage()).toBe(1);
  });

  it('should append subsequent batch when loadMore is triggered', () => {
    service.getLearningReport.mockReturnValue(of(page2Response));

    component.hasMore.set(true);
    component.loadMore();

    expect(service.getLearningReport).toHaveBeenCalledWith({
      status: undefined,
      type: undefined,
      sortBy: 'date',
      sortOrder: 'desc',
      page: 2,
      limit: 10
    });

    expect(component.courses().length).toBe(3);
    expect(component.courses()[0].title).toBe('Physics Full Test');
    expect(component.courses()[2].title).toBe('Chemistry Full Test');
    expect(component.currentPage()).toBe(2);
  });

  it('should call startTest with builtin_test_id when starting a built-in test', () => {
    const notStartedCourse = component.courses().find((c) => c.rawStatus === 'not_started')!;
    expect(notStartedCourse).toBeTruthy();

    component.onStartTest(notStartedCourse);

    expect(testService.startTest).toHaveBeenCalledWith({ builtin_test_id: 1003 });
    const stored = sessionStorage.getItem('activePreviousYearTest');
    expect(stored).toBeTruthy();
    const session = JSON.parse(stored!);
    expect(session.sessionId).toBe('session-12345');
    expect(session.questions.length).toBe(1);
  });

  it('should call startTest with previous_year_paper_id for previous year records', () => {
    const pyCourse = {
      ...component.courses()[0],
      id: '101',
      test_id: 101,
      type: 'Previous Year Test',
      rawStatus: 'not_started' as const,
      rawItem: {
        ...sampleReportItem,
        id: 101,
        test_id: 101,
        source: 'previous_year' as const
      }
    };

    component.onStartTest(pyCourse);

    expect(testService.startTest).toHaveBeenCalledWith({ previous_year_paper_id: 101 });
  });

  it('should handle startTest failure gracefully', () => {
    testService.startTest.mockReturnValue(throwError(() => new Error('Failed to start test')));
    const notStartedCourse = component.courses().find((c) => c.rawStatus === 'not_started')!;

    component.onStartTest(notStartedCourse);

    expect(component.errorMessage()).toBe('Failed to start test');
    expect(component.startingTestId()).toBeNull();
  });

  it('should call getTestSession with activeSessionId when continuing an in_progress test', () => {
    const inProgressCourse = {
      ...component.courses()[0],
      id: '2001',
      test_id: 2001,
      rawStatus: 'in_progress' as const,
      rawItem: {
        ...sampleReportItem,
        id: 2001,
        test_id: 2001,
        status: 'in_progress' as const,
        activeSessionId: 'session-active-999'
      }
    };

    component.onContinueTest(inProgressCourse);

    expect(testService.getTestSession).toHaveBeenCalledWith('session-active-999');
    expect(testService.startTest).not.toHaveBeenCalled();

    const stored = sessionStorage.getItem('activePreviousYearTest');
    expect(stored).toBeTruthy();
    const session = JSON.parse(stored!);
    expect(session.sessionId).toBe('session-active-999');
    expect(session.questions.length).toBe(1);
    expect(session.questionStates[0].selectedOption).toBe('B');
  });

  it('should not call getTestSession if activeSessionId is missing', () => {
    const invalidCourse = {
      ...component.courses()[0],
      id: '2002',
      test_id: 2002,
      rawStatus: 'in_progress' as const,
      rawItem: {
        ...sampleReportItem,
        id: 2002,
        test_id: 2002,
        status: 'in_progress' as const,
        activeSessionId: null
      }
    };

    component.onContinueTest(invalidCourse);

    expect(testService.getTestSession).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBe('No active session found to continue this test.');
  });

  it('should handle getTestSession failure gracefully without navigating', () => {
    testService.getTestSession.mockReturnValue(throwError(() => new Error('Session expired')));
    const inProgressCourse = {
      ...component.courses()[0],
      id: '2001',
      test_id: 2001,
      rawStatus: 'in_progress' as const,
      rawItem: {
        ...sampleReportItem,
        id: 2001,
        test_id: 2001,
        status: 'in_progress' as const,
        activeSessionId: 'session-active-999'
      }
    };

    component.onContinueTest(inProgressCourse);

    expect(component.errorMessage()).toBe('Session expired');
    expect(component.startingTestId()).toBeNull();
  });

  it('should call startTest with custom_test_id for custom tests', () => {
    const customCourse = {
      ...component.courses()[0],
      id: '2002',
      test_id: 2002,
      type: 'Custom',
      rawStatus: 'not_started' as const,
      rawItem: {
        ...sampleReportItem,
        id: 2002,
        test_id: 2002,
        custom_test_id: 2002,
        source: 'custom' as const
      }
    };

    component.onStartTest(customCourse);

    expect(testService.startTest).toHaveBeenCalledWith({ custom_test_id: 2002 });
  });

  it('should render Retake Test button for completed tests and trigger startTest on click', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const retakeButton = compiled.querySelector('.retake-test-btn') as HTMLButtonElement;

    expect(retakeButton).toBeTruthy();
    expect(retakeButton.textContent?.trim()).toContain('Retake Test');

    const completedCourse = component.courses()[0];
    expect(completedCourse.rawStatus).toBe('completed');

    retakeButton.click();

    expect(testService.startTest).toHaveBeenCalledWith({ builtin_test_id: 1001 });
  });

  it('should call onStartTest when clicking a completed test row', () => {
    const startTestSpy = vi.spyOn(component, 'onStartTest');
    const completedCourse = component.courses()[0];

    component.startCourseTest(completedCourse);

    expect(startTestSpy).toHaveBeenCalledWith(completedCourse);
  });

  it('should call startTest with previous_year_paper_id when retaking previous year paper', () => {
    const pyCourse = {
      ...component.courses()[0],
      id: '3001',
      test_id: 3001,
      type: 'Previous Year Test',
      rawStatus: 'completed' as const,
      rawItem: {
        ...sampleReportItem,
        id: 3001,
        test_id: 3001,
        source: 'previous_year' as const
      }
    };

    component.onStartTest(pyCourse);

    expect(testService.startTest).toHaveBeenCalledWith({ previous_year_paper_id: 3001 });
  });

  it('should prevent multiple startTest calls when a request is in flight', () => {
    const completedCourse = component.courses()[0];
    component.startingTestId.set('1001');

    component.onStartTest(completedCourse);

    expect(testService.startTest).not.toHaveBeenCalled();
  });

  it('should trigger loadMore when onWindowScroll reaches threshold', () => {
    const loadMoreSpy = vi.spyOn(component, 'loadMore');
    component.hasMore.set(true);

    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
    Object.defineProperty(window, 'scrollY', { value: 1200, writable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2100, writable: true });

    component.onWindowScroll();

    expect(loadMoreSpy).toHaveBeenCalled();
  });

  it('should NOT trigger loadMore on scroll if isLoadingMore is true', () => {
    const loadMoreSpy = vi.spyOn(component, 'loadMore');
    component.isLoadingMore.set(true);
    component.hasMore.set(true);

    component.onWindowScroll();

    expect(loadMoreSpy).not.toHaveBeenCalled();
  });

  it('should automatically order tests in filteredCourses by Status Priority: IN PROGRESS -> NOT STARTED -> COMPLETED', () => {
    const testItems: LearningReportItem[] = [
      {
        ...sampleReportItem,
        id: 1,
        test_id: 1,
        test_name: 'Completed Test 1',
        status: 'completed',
        lastModifiedAt: '2026-08-15T00:00:00.000Z'
      },
      {
        ...sampleReportItem,
        id: 2,
        test_id: 2,
        test_name: 'Not Started Test 2',
        status: 'not_started',
        lastModifiedAt: '2026-08-16T00:00:00.000Z'
      },
      {
        ...sampleReportItem,
        id: 3,
        test_id: 3,
        test_name: 'In Progress Test 3',
        status: 'in_progress',
        lastModifiedAt: '2026-08-17T00:00:00.000Z'
      },
      {
        ...sampleReportItem,
        id: 4,
        test_id: 4,
        test_name: 'In Progress Test 4',
        status: 'in_progress',
        lastModifiedAt: '2026-08-18T00:00:00.000Z'
      },
      {
        ...sampleReportItem,
        id: 5,
        test_id: 5,
        test_name: 'Completed Test 5',
        status: 'completed',
        lastModifiedAt: '2026-08-14T00:00:00.000Z'
      }
    ];

    service.getLearningReport.mockReturnValue(of({
      status: 'success',
      data: testItems,
      pagination: { page: 1, limit: 10, total: 5, totalPages: 1 }
    }));

    component.loadReport(false);
    fixture.detectChanges();

    const displayed = component.filteredCourses();
    expect(displayed.length).toBe(5);

    // Group 1: In Progress
    expect(displayed[0].rawStatus).toBe('in_progress');
    expect(displayed[0].id).toBe('4'); // newer date first
    expect(displayed[1].rawStatus).toBe('in_progress');
    expect(displayed[1].id).toBe('3');

    // Group 2: Not Started
    expect(displayed[2].rawStatus).toBe('not_started');
    expect(displayed[2].id).toBe('2');

    // Group 3: Completed
    expect(displayed[3].rawStatus).toBe('completed');
    expect(displayed[3].id).toBe('1');
    expect(displayed[4].rawStatus).toBe('completed');
    expect(displayed[4].id).toBe('5');
  });

  it('should reorder incrementally loaded pages into the correct status groups without duplicates', () => {
    // Initial page 1 has Completed and Not Started
    const page1 = [
      { ...sampleReportItem, id: 101, test_id: 101, status: 'completed' as const },
      { ...sampleReportItem, id: 102, test_id: 102, status: 'not_started' as const }
    ];
    service.getLearningReport.mockReturnValue(of({
      status: 'success',
      data: page1,
      pagination: { page: 1, limit: 2, total: 3, totalPages: 2 }
    }));
    component.loadReport(false);
    fixture.detectChanges();

    expect(component.filteredCourses().map(c => c.rawStatus)).toEqual(['not_started', 'completed']);

    // Page 2 loads with an In Progress test
    const page2 = [
      { ...sampleReportItem, id: 103, test_id: 103, status: 'in_progress' as const },
      // Duplicate item 101 should be ignored
      { ...sampleReportItem, id: 101, test_id: 101, status: 'completed' as const }
    ];
    service.getLearningReport.mockReturnValue(of({
      status: 'success',
      data: page2,
      pagination: { page: 2, limit: 2, total: 3, totalPages: 2 }
    }));
    component.loadReport(true);
    fixture.detectChanges();

    const finalStatuses = component.filteredCourses().map(c => c.rawStatus);
    expect(finalStatuses).toEqual(['in_progress', 'not_started', 'completed']);
    expect(component.courses().length).toBe(3); // de-duplicated
  });
});
