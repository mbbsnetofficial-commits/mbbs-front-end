import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { UcatLearningReport } from './learning-report';
import { UcatLearningReportService } from '../../services/ucat-learning-report.service';
import { UcatModalService } from '../../services/ucat-modal.service';
import { UcatService } from '../../services/ucat.service';
import { UcatPreviousYearService } from '../../services/ucat-previous-year.service';
import {
  UcatLearningReportItem,
  UcatLearningReportResponse,
  UcatSummaryResponse
} from '../../models/ucat-learning-report.model';
import { UcatStartTestResponse } from '../../models/ucat.model';

describe('UcatLearningReport', () => {
  let component: UcatLearningReport;
  let fixture: ComponentFixture<UcatLearningReport>;
  let service: {
    getUcatLearningReport: ReturnType<typeof vi.fn>;
    getUcatSummary: ReturnType<typeof vi.fn>;
  };
  let ucatServiceMock: {
    startTest: ReturnType<typeof vi.fn>;
    getTestSession: ReturnType<typeof vi.fn>;
  };
  let previousYearServiceMock: {
    startPreviousYearTest: ReturnType<typeof vi.fn>;
  };
  let router: Router;
  let ucatModalService: UcatModalService;

  const sampleBuiltinItem: UcatLearningReportItem = {
    id: 2001,
    test_id: 2001,
    test_code: 'UCAT_BUILTIN_VR_01',
    test_name: 'Verbal Reasoning Full Test',
    course_name: {
      title: 'Verbal Reasoning Full Test',
      subtitle: 'Verbal Reasoning Practice'
    },
    source: 'builtin',
    type: 'Verbal Reasoning',
    level: 'Intermediate',
    duration_minutes: 21,
    total_questions: 44,
    total_marks: 900,
    totalMarks: 900,
    status: 'completed',
    progress: 100,
    time_spent: '21m 0s',
    timeSpentSeconds: 1260,
    score: {
      earned: 720,
      total_marks: 900,
      formatted: '720 / 900'
    },
    activeSessionId: null,
    lastModifiedAt: '2026-08-16T00:00:00.000Z',
    date_modified: '16 Aug 2026'
  };

  const sampleCustomItem: UcatLearningReportItem = {
    id: 2002,
    test_id: 2002,
    custom_test_id: 2002,
    test_code: 'UCAT_CUSTOM_2002',
    test_name: 'My Decision Making Drill',
    course_name: {
      title: 'My Decision Making Drill',
      subtitle: 'Custom Practice'
    },
    source: 'custom',
    type: 'Custom',
    level: 'Intermediate',
    duration_minutes: 15,
    total_questions: 15,
    total_marks: 900,
    status: 'not_started',
    progress: 0,
    time_spent: '0m',
    timeSpentSeconds: 0,
    score: null,
    activeSessionId: null,
    lastModifiedAt: '2026-08-17T00:00:00.000Z',
    date_modified: '17 Aug 2026'
  };

  const sampleInProgressItem: UcatLearningReportItem = {
    ...sampleCustomItem,
    id: 2004,
    test_id: 2004,
    active_session_id: 'session-ucat-inprogress-123',
    status: 'in_progress',
    progress: 50,
    score: {
      earned: 450,
      total_marks: 900,
      formatted: '450 / 900'
    }
  };

  const mockStartResponse: UcatStartTestResponse = {
    success: true,
    sessionId: 'session-ucat-new-999',
    duration: 15,
    total_questions: 15,
    questions: [
      { id: 1, question: 'Question 1', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D' }
    ]
  };

  const page1Response: UcatLearningReportResponse = {
    status: 'success',
    message: 'UCAT learning report fetched successfully.',
    data: [sampleBuiltinItem, sampleCustomItem],
    pagination: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1
    }
  };

  const mockSummaryResponse: UcatSummaryResponse = {
    status: 'success',
    message: 'UCAT dashboard summary fetched successfully.',
    data: {
      student_id: 'STU123456',
      total_time_spent_seconds: 4500,
      total_time_spent: '1h 15m',
      average_score: '720 / 900',
      average_score_number: 720,
      completed_tests: 5,
      current_streak: 7,
      streak_formatted: '7 Days',
      build_test_cta: 'Build your own test'
    }
  };

  beforeEach(async () => {
    service = {
      getUcatLearningReport: vi.fn().mockReturnValue(of(page1Response)),
      getUcatSummary: vi.fn().mockReturnValue(of(mockSummaryResponse))
    };

    ucatServiceMock = {
      startTest: vi.fn().mockReturnValue(of(mockStartResponse)),
      getTestSession: vi.fn().mockReturnValue(of({
        data: {
          sessionId: 'session-ucat-inprogress-123',
          duration: 15,
          questions: [
            { id: 1, question: 'Q1', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D' }
          ],
          answers: [
            { question_id: 1, selected_option: 'B', time_spent: 12 }
          ]
        }
      }))
    };

    previousYearServiceMock = {
      startPreviousYearTest: vi.fn().mockReturnValue(of(mockStartResponse))
    };

    await TestBed.configureTestingModule({
      imports: [UcatLearningReport],
      providers: [
        provideRouter([]),
        { provide: UcatLearningReportService, useValue: service },
        { provide: UcatService, useValue: ucatServiceMock },
        { provide: UcatPreviousYearService, useValue: previousYearServiceMock },
        UcatModalService
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(UcatLearningReport);
    component = fixture.componentInstance;
    ucatModalService = TestBed.inject(UcatModalService);
  }, 30000);

  it('should create UcatLearningReport and load summary on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(service.getUcatSummary).toHaveBeenCalledTimes(1);
    expect(service.getUcatLearningReport).toHaveBeenCalledTimes(1);
    expect(component.summary()?.current_streak).toBe(7);
    expect(component.courses().length).toBe(2);
  });

  it('should render both built-in and custom tests side-by-side', () => {
    fixture.detectChanges();
    const courses = component.courses();
    expect(courses.length).toBe(2);

    const builtinCourse = courses.find((c) => c.rawItem?.source === 'builtin');
    expect(builtinCourse).toBeDefined();
    expect(builtinCourse?.stageInfo).toBe('Built-in');

    const customCourse = courses.find((c) => c.rawItem?.source === 'custom');
    expect(customCourse).toBeDefined();
    expect(customCourse?.stageInfo).toBe('Custom');
  });

  it('should start custom test using custom_test_id without student_id', () => {
    fixture.detectChanges();
    const customCourse = component.courses().find((c) => c.id === '2002');
    expect(customCourse).toBeDefined();

    component.onStartTest(customCourse!);

    expect(ucatServiceMock.startTest).toHaveBeenCalledWith(
      expect.objectContaining({
        custom_test_id: 2002
      })
    );
    const payload = ucatServiceMock.startTest.mock.calls[0][0];
    expect(payload.student_id).toBeUndefined();
    expect(router.navigate).toHaveBeenCalledWith(['/dynamic/ucat/practice']);
  });

  it('should continue an in-progress session with the existing sessionId', () => {
    service.getUcatLearningReport.mockReturnValue(of({
      status: 'success',
      data: [sampleInProgressItem],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
    }));
    fixture.detectChanges();

    const inProgressCourse = component.courses().find((c) => c.id === '2004');
    expect(inProgressCourse).toBeDefined();

    component.onContinueTest(inProgressCourse!);

    expect(ucatServiceMock.getTestSession).toHaveBeenCalledWith('session-ucat-inprogress-123');
    expect(router.navigate).toHaveBeenCalledWith(['/dynamic/ucat/practice']);
  });

  it('should retake a completed builtin test with normalized uppercase subject enum without reusing old sessionId', () => {
    fixture.detectChanges();
    const completedCourse = component.courses().find((c) => c.id === '2001');
    expect(completedCourse).toBeDefined();

    component.onStartTest(completedCourse!);

    expect(ucatServiceMock.startTest).toHaveBeenCalledTimes(1);
    expect(ucatServiceMock.startTest).toHaveBeenCalledWith(
      expect.objectContaining({
        subjects: ['VERBAL_REASONING'],
        limit: 44,
        duration: 21
      })
    );
    expect(router.navigate).toHaveBeenCalledWith(['/dynamic/ucat/practice']);
  });

  it('should block duplicate clicks when startingTestId is active', () => {
    fixture.detectChanges();
    const customCourse = component.courses().find((c) => c.id === '2002');

    component.startingTestId.set('2002');
    component.onStartTest(customCourse!);

    expect(ucatServiceMock.startTest).not.toHaveBeenCalled();
  });

  it('should handle start test failure without fake session creation', () => {
    ucatServiceMock.startTest.mockReturnValue(
      throwError(() => ({ status: 500, error: { message: 'Start failed' } }))
    );
    fixture.detectChanges();
    const customCourse = component.courses().find((c) => c.id === '2002');

    component.onStartTest(customCourse!);

    expect(component.startingTestId()).toBeNull();
    expect(component.errorMessage()).toBe('Start failed');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should handle 403 Forbidden on test start with authorization error', () => {
    ucatServiceMock.startTest.mockReturnValue(
      throwError(() => ({ status: 403, error: { message: 'Forbidden' } }))
    );
    fixture.detectChanges();
    const customCourse = component.courses().find((c) => c.id === '2002');

    component.onStartTest(customCourse!);

    expect(component.errorMessage()).toBe('You are not authorized to access this test session.');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should retake a completed custom test and create a fresh new session without student_id in payload', () => {
    const completedCustomItem: UcatLearningReportItem = {
      ...sampleCustomItem,
      id: 3001,
      test_id: 3001,
      custom_test_id: 3001,
      status: 'completed',
      score: { earned: 800, total_marks: 900, formatted: '800 / 900' }
    };
    service.getUcatLearningReport.mockReturnValue(of({
      status: 'success',
      data: [completedCustomItem],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
    }));
    fixture.detectChanges();

    const course = component.courses().find((c) => c.id === '3001');
    expect(course).toBeDefined();

    component.onStartTest(course!);

    expect(ucatServiceMock.startTest).toHaveBeenCalledTimes(1);
    expect(ucatServiceMock.startTest).toHaveBeenCalledWith(
      expect.objectContaining({
        custom_test_id: 3001
      })
    );
    const payload = ucatServiceMock.startTest.mock.calls[0][0];
    expect(payload.student_id).toBeUndefined();
    expect(router.navigate).toHaveBeenCalledWith(['/dynamic/ucat/practice']);
  });

  it('should retake a previous year test via previousYearService.startPreviousYearTest', () => {
    const completedPyItem: UcatLearningReportItem = {
      id: 4001,
      test_id: 4001,
      previous_year_paper_id: 15,
      test_code: 'UCAT_PY_2023',
      test_name: 'UCAT 2023 Official Paper',
      course_name: { title: 'UCAT 2023 Official Paper', subtitle: 'Official Past Exam' },
      source: 'previous_year',
      type: 'Previous Year Test',
      level: 'Advanced',
      duration_minutes: 120,
      total_questions: 233,
      total_marks: 3600,
      status: 'completed',
      progress: 100,
      time_spent: '120m 0s',
      timeSpentSeconds: 7200,
      score: { earned: 2800, total_marks: 3600, formatted: '2800 / 3600' },
      activeSessionId: null,
      lastModifiedAt: '2026-08-16T00:00:00.000Z',
      date_modified: '16 Aug 2026'
    };
    service.getUcatLearningReport.mockReturnValue(of({
      status: 'success',
      data: [completedPyItem],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
    }));
    fixture.detectChanges();

    const course = component.courses().find((c) => c.id === '4001');
    expect(course).toBeDefined();

    component.onStartTest(course!);

    expect(previousYearServiceMock.startPreviousYearTest).toHaveBeenCalledTimes(1);
    expect(previousYearServiceMock.startPreviousYearTest).toHaveBeenCalledWith(
      15,
      { limit: 233, duration: 120 }
    );
    expect(router.navigate).toHaveBeenCalledWith(['/dynamic/ucat/previous-year']);
  });

  it('should automatically order tests in filteredCourses by Status Priority: IN PROGRESS -> NOT STARTED -> COMPLETED', () => {
    const testItems: UcatLearningReportItem[] = [
      {
        ...sampleBuiltinItem,
        id: 1,
        test_id: 1,
        test_name: 'Completed Test 1',
        status: 'completed',
        lastModifiedAt: '2026-08-15T00:00:00.000Z'
      },
      {
        ...sampleCustomItem,
        id: 2,
        test_id: 2,
        test_name: 'Not Started Test 2',
        status: 'not_started',
        lastModifiedAt: '2026-08-16T00:00:00.000Z'
      },
      {
        ...sampleInProgressItem,
        id: 3,
        test_id: 3,
        test_name: 'In Progress Test 3',
        status: 'in_progress',
        lastModifiedAt: '2026-08-17T00:00:00.000Z'
      },
      {
        ...sampleInProgressItem,
        id: 4,
        test_id: 4,
        test_name: 'In Progress Test 4',
        status: 'in_progress',
        lastModifiedAt: '2026-08-18T00:00:00.000Z'
      },
      {
        ...sampleBuiltinItem,
        id: 5,
        test_id: 5,
        test_name: 'Completed Test 5',
        status: 'completed',
        lastModifiedAt: '2026-08-14T00:00:00.000Z'
      }
    ];

    service.getUcatLearningReport.mockReturnValue(of({
      status: 'success',
      data: testItems,
      pagination: { page: 1, limit: 10, total: 5, totalPages: 1 }
    }));

    component.loadReport(false);
    fixture.detectChanges();

    const displayed = component.filteredCourses();
    expect(displayed.length).toBe(5);

    // Group 1: In Progress (newest date first)
    expect(displayed[0].rawStatus).toBe('in_progress');
    expect(displayed[0].id).toBe('4');
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
      { ...sampleBuiltinItem, id: 101, test_id: 101, status: 'completed' as const },
      { ...sampleCustomItem, id: 102, test_id: 102, status: 'not_started' as const }
    ];
    service.getUcatLearningReport.mockReturnValue(of({
      status: 'success',
      data: page1,
      pagination: { page: 1, limit: 2, total: 3, totalPages: 2 }
    }));
    component.loadReport(false);
    fixture.detectChanges();

    expect(component.filteredCourses().map(c => c.rawStatus)).toEqual(['not_started', 'completed']);

    // Page 2 loads with an In Progress test
    const page2 = [
      { ...sampleInProgressItem, id: 103, test_id: 103, status: 'in_progress' as const },
      // Duplicate item 101 should be ignored
      { ...sampleBuiltinItem, id: 101, test_id: 101, status: 'completed' as const }
    ];
    service.getUcatLearningReport.mockReturnValue(of({
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

  it('should filter courses by activeTab when switching between All, In Progress, and Completed', () => {
    const testItems: UcatLearningReportItem[] = [
      {
        ...sampleBuiltinItem,
        id: 10,
        test_id: 10,
        test_name: 'Completed Test 10',
        status: 'completed'
      },
      {
        ...sampleCustomItem,
        id: 20,
        test_id: 20,
        test_name: 'Not Started Test 20',
        status: 'not_started'
      },
      {
        ...sampleInProgressItem,
        id: 30,
        test_id: 30,
        test_name: 'In Progress Test 30',
        status: 'in_progress'
      }
    ];

    service.getUcatLearningReport.mockReturnValue(of({
      status: 'success',
      data: testItems,
      pagination: { page: 1, limit: 10, total: 3, totalPages: 1 }
    }));

    component.loadReport(false);
    fixture.detectChanges();

    // Default 'all' tab -> shows all 3
    expect(component.filteredCourses().length).toBe(3);

    // Switch to 'in_progress' tab -> only in-progress test shown
    component.setTab('in_progress');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('in_progress');
    const inProgressList = component.filteredCourses();
    expect(inProgressList.length).toBe(1);
    expect(inProgressList[0].rawStatus).toBe('in_progress');
    expect(inProgressList[0].id).toBe('30');
    expect(service.getUcatLearningReport).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'in_progress' })
    );

    // Switch to 'completed' tab -> only completed test shown
    component.setTab('completed');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('completed');
    const completedList = component.filteredCourses();
    expect(completedList.length).toBe(1);
    expect(completedList[0].rawStatus).toBe('completed');
    expect(completedList[0].id).toBe('10');
    expect(service.getUcatLearningReport).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'completed' })
    );

    // Switch back to 'all' -> all tests shown
    component.setTab('all');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('all');
    expect(component.filteredCourses().length).toBe(3);
    expect(service.getUcatLearningReport).toHaveBeenCalledWith(
      expect.objectContaining({ status: undefined })
    );
  });

  it('should normalize varied status strings and infer status from progress/active session correctly', () => {
    const rawItems: any[] = [
      {
        ...sampleBuiltinItem,
        id: 501,
        test_id: 501,
        status: 'Completed', // PascalCase
        progress: 100
      },
      {
        ...sampleCustomItem,
        id: 502,
        test_id: 502,
        status: 'In Progress', // Space
        progress: 45
      },
      {
        ...sampleCustomItem,
        id: 503,
        test_id: 503,
        status: undefined, // Missing status but progress 100
        progress: 100
      },
      {
        ...sampleCustomItem,
        id: 504,
        test_id: 504,
        status: undefined, // Missing status but has active session
        activeSessionId: 'sess-active-504',
        progress: 20
      }
    ];

    service.getUcatLearningReport.mockReturnValue(of({
      status: 'success',
      data: rawItems,
      pagination: { page: 1, limit: 10, total: 4, totalPages: 1 }
    }));

    component.loadReport(false);
    fixture.detectChanges();

    const courses = component.courses();
    const item501 = courses.find(c => c.id === '501');
    expect(item501?.rawStatus).toBe('completed');
    expect(item501?.status).toBe('Completed');

    const item502 = courses.find(c => c.id === '502');
    expect(item502?.rawStatus).toBe('in_progress');
    expect(item502?.status).toBe('In Progress');

    const item503 = courses.find(c => c.id === '503');
    expect(item503?.rawStatus).toBe('completed');
    expect(item503?.status).toBe('Completed');

    const item504 = courses.find(c => c.id === '504');
    expect(item504?.rawStatus).toBe('in_progress');
    expect(item504?.status).toBe('In Progress');
  });

  it('should filter courses by activeCategories', () => {
    const testItems: UcatLearningReportItem[] = [
      {
        ...sampleBuiltinItem,
        id: 601,
        test_id: 601,
        type: 'Verbal Reasoning',
        test_name: 'Verbal Reasoning Drill'
      },
      {
        ...sampleBuiltinItem,
        id: 602,
        test_id: 602,
        type: 'Decision Making',
        test_name: 'Decision Making Drill'
      }
    ];

    service.getUcatLearningReport.mockReturnValue(of({
      status: 'success',
      data: testItems,
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
    }));

    component.loadReport(false);
    fixture.detectChanges();

    expect(component.filteredCourses().length).toBe(2);

    component.toggleCategory('Verbal Reasoning');
    fixture.detectChanges();

    expect(component.filteredCourses().length).toBe(1);
    expect(component.filteredCourses()[0].id).toBe('601');
  });
});
