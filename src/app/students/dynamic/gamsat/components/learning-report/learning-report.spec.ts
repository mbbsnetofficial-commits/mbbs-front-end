import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { GamsatLearningReport } from './learning-report';
import { environment } from '../../../../../../environments/environment';
import { API } from '../../constants/api.constants';

describe('GamsatLearningReport', () => {
  let component: GamsatLearningReport;
  let fixture: ComponentFixture<GamsatLearningReport>;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GamsatLearningReport],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(GamsatLearningReport);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('1. should create and load summary and unified test catalogue on init', () => {
    fixture.detectChanges();

    // Summary request
    const summaryReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_SUMMARY}`);
    expect(summaryReq.request.method).toBe('GET');
    summaryReq.flush({
      success: true,
      data: {
        totalPracticeTime: 4250,
        totalPracticeTimeFormatted: '70 mins',
        averageRawScore: 21.5,
        completedTests: 4,
        currentStreak: 3,
        longestStreak: 5,
        totalTests: 6,
        averageAccuracy: 81.2
      }
    });

    // Filters request
    const filtersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT_FILTERS}`);
    expect(filtersReq.request.method).toBe('GET');
    filtersReq.flush({
      success: true,
      data: { sections: ['SECTION_I', 'SECTION_II', 'SECTION_III'] }
    });

    // Learning report request
    const reportReq = httpTesting.expectOne((req) => req.url.includes(API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT));
    expect(reportReq.request.method).toBe('GET');
    reportReq.flush({
      success: true,
      data: {
        kpi: {
          totalPracticeTime: 4250,
          totalPracticeTimeFormatted: '70 mins',
          averageScore: 21.5,
          completedTests: 4,
          currentStreak: 3,
          averageAccuracy: 81.2
        },
        tests: [
          {
            id: 'GAMSAT-1724945892120-X8J3K',
            sessionId: 'GAMSAT-1724945892120-X8J3K',
            dateModified: '2026-08-29T15:52:30.000Z',
            testName: 'GAMSAT Practice Set 1',
            type: 'CUSTOM_TEST',
            level: 'MIXED',
            difficulty: 'MIXED',
            status: 'COMPLETED',
            progress: 100,
            timeSpent: 1520,
            timeSpentFormatted: '25m 20s',
            score: '21 / 25',
            rawScore: 21,
            accuracy: '84%',
            action: 'REVIEW'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1
        }
      }
    });

    // Papers request
    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    expect(papersReq.request.method).toBe('GET');
    papersReq.flush({
      success: true,
      data: [
        {
          id: 'pyq-2019',
          paperId: 'pyq-2019',
          numericId: 11,
          name: 'GAMSAT_2019_STYLE',
          title: 'GAMSAT 2019 STYLE',
          questionCount: 137,
          durationMinutes: 270
        }
      ]
    });

    // Builtin request
    const builtinReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.BUILTIN}`);
    expect(builtinReq.request.method).toBe('GET');
    builtinReq.flush({
      success: true,
      data: [
        {
          id: 'gamsat-mock-1',
          name: 'GAMSAT Full Mock Exam',
          title: 'GAMSAT Full Mock Exam (Comprehensive)',
          test_type: 'FULL_TEST',
          total_questions: 137,
          duration_minutes: 270
        }
      ]
    });

    expect(component.summary()?.currentStreak).toBe(3);
    expect(component.formattedPracticeTime()).toBe('70 mins');
    expect(component.formattedAverageScore()).toBe('21.5');
    expect(component.formattedCompletedTests()).toBe('4');
    expect(component.formattedStreak()).toBe('3 days');
    expect(component.courses().length).toBe(3); // 1 custom attempt + 1 unattempted PYQ + 1 unattempted Built-in
    expect(component.isLoading()).toBe(false);
  });

  it('2. should handle empty user state gracefully with available catalogue tests rendered', () => {
    fixture.detectChanges();

    const summaryReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_SUMMARY}`);
    summaryReq.flush({
      success: true,
      data: {
        totalPracticeTime: 0,
        averageRawScore: 0,
        completedTests: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalTests: 0,
        averageAccuracy: 0
      }
    });

    const filtersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT_FILTERS}`);
    filtersReq.flush({ success: true, data: { sections: [] } });

    const reportReq = httpTesting.expectOne((req) => req.url.includes(API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT));
    reportReq.flush({
      success: true,
      data: {
        kpi: {
          totalPracticeTime: 0,
          totalPracticeTimeFormatted: '0 mins',
          averageScore: 0,
          completedTests: 0,
          currentStreak: 0,
          averageAccuracy: 0
        },
        tests: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 1 }
      }
    });

    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({
      success: true,
      data: [
        {
          id: 'pyq-2019',
          paperId: 'pyq-2019',
          title: 'GAMSAT 2019 STYLE',
          questionCount: 137,
          durationMinutes: 270
        }
      ]
    });

    const builtinReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.BUILTIN}`);
    builtinReq.flush({
      success: true,
      data: [
        {
          id: 'gamsat-mock-1',
          title: 'GAMSAT Full Mock Exam (Comprehensive)',
          test_type: 'FULL_TEST',
          total_questions: 137,
          duration_minutes: 270
        }
      ]
    });

    expect(component.formattedPracticeTime()).toBe('0 mins');
    expect(component.formattedAverageScore()).toBe('0');
    expect(component.formattedCompletedTests()).toBe('0');
    expect(component.formattedStreak()).toBe('0 days');
    expect(component.courses().length).toBe(2);
    expect(component.courses().some((c) => c.title === 'GAMSAT 2019 STYLE')).toBe(true);
    expect(component.courses().some((c) => c.title.includes('Mock Exam'))).toBe(true);
    expect(component.isLoading()).toBe(false);
  });

  it('3. should calculate progress accurately from answered questions count without hardcoding 50%', () => {
    fixture.detectChanges();

    const summaryReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_SUMMARY}`);
    summaryReq.flush({ success: true, data: {} });

    const filtersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT_FILTERS}`);
    filtersReq.flush({ success: true, data: { sections: [] } });

    const reportReq = httpTesting.expectOne((req) => req.url.includes(API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT));
    reportReq.flush({
      success: true,
      data: {
        tests: [
          {
            id: 'sess-1',
            sessionId: 'GAMSAT-PYQ-1',
            testName: 'In Progress Test (0 answered)',
            status: 'IN_PROGRESS',
            totalQuestions: 137,
            answeredQuestions: 0
          },
          {
            id: 'sess-2',
            sessionId: 'GAMSAT-PYQ-2',
            testName: 'In Progress Test (5 answered)',
            status: 'IN_PROGRESS',
            totalQuestions: 137,
            answeredQuestions: 5
          },
          {
            id: 'sess-3',
            sessionId: 'GAMSAT-PYQ-3',
            testName: 'In Progress Test (68 answered)',
            status: 'IN_PROGRESS',
            totalQuestions: 137,
            answeredQuestions: 68
          },
          {
            id: 'sess-4',
            sessionId: 'GAMSAT-PYQ-4',
            testName: 'Completed Test',
            status: 'COMPLETED',
            totalQuestions: 137,
            answeredQuestions: 137
          },
          {
            id: 'sess-5',
            sessionId: 'GAMSAT-PYQ-5',
            testName: 'In Progress Test with Empty Answers Array',
            status: 'IN_PROGRESS',
            totalQuestions: 137,
            progress: 50, // Stale backend value that must NOT override real empty answers
            answers: []
          },
          {
            id: 'sess-6',
            sessionId: 'GAMSAT-PYQ-6',
            testName: 'In Progress Test with Duplicate Answers',
            status: 'IN_PROGRESS',
            totalQuestions: 10,
            answers: [
              { questionId: 1, selectedOption: 'A' },
              { questionId: 1, selectedOption: 'B' },
              { questionId: 2, selectedOption: 'C' }
            ]
          }
        ]
      }
    });

    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({ success: true, data: [] });

    const builtinReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.BUILTIN}`);
    builtinReq.flush({ success: true, data: [] });

    const courses = component.courses();
    expect(courses.length).toBe(6);

    // 0 / 137 answers => 0% (NOT 50%)
    expect(courses[0].progressPercent).toBe(0);
    expect(courses[0].rawStatus).toBe('in_progress');

    // 5 / 137 answers => 4%
    expect(courses[1].progressPercent).toBe(4);
    expect(courses[1].rawStatus).toBe('in_progress');

    // 68 / 137 answers => 50%
    expect(courses[2].progressPercent).toBe(50);
    expect(courses[2].rawStatus).toBe('in_progress');

    // Completed => 100%
    expect(courses[3].progressPercent).toBe(100);
    expect(courses[3].rawStatus).toBe('completed');

    // Empty answers array => 0% (NOT 50%)
    expect(courses[4].progressPercent).toBe(0);
    expect(courses[4].rawStatus).toBe('in_progress');

    // 2 unique answers out of 10 => 20%
    expect(courses[5].progressPercent).toBe(20);
    expect(courses[5].rawStatus).toBe('in_progress');
  });

  it('4. should group multiple attempts of the same test into ONE row prioritizing in-progress attempt', () => {
    fixture.detectChanges();

    const summaryReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_SUMMARY}`);
    summaryReq.flush({ success: true, data: {} });

    const filtersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT_FILTERS}`);
    filtersReq.flush({ success: true, data: { sections: [] } });

    const reportReq = httpTesting.expectOne((req) => req.url.includes(API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT));
    reportReq.flush({
      success: true,
      data: {
        tests: [
          {
            id: 'sess-1',
            sessionId: 'GAMSAT-PYQ-1788156949830-ZMSPH',
            testName: 'GAMSAT_2019_STYLE',
            paperId: '44dba1ca30e7a59f101b1ab1',
            status: 'COMPLETED',
            totalQuestions: 137,
            score: '60 / 137',
            dateModified: '2026-08-30T10:00:00.000Z'
          },
          {
            id: 'sess-2',
            sessionId: 'GAMSAT-PYQ-1788190724641-XGYE5',
            testName: 'GAMSAT 2019 STYLE',
            paperId: '44dba1ca30e7a59f101b1ab1',
            status: 'IN_PROGRESS',
            totalQuestions: 137,
            answeredQuestions: 10,
            dateModified: '2026-08-31T14:00:00.000Z'
          }
        ]
      }
    });

    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({
      success: true,
      data: [
        {
          id: '44dba1ca30e7a59f101b1ab1',
          paperId: '44dba1ca30e7a59f101b1ab1',
          title: 'GAMSAT 2019 STYLE',
          questionCount: 137,
          durationMinutes: 270
        },
        {
          id: '44dba1ca30e7a59f101b1ab2',
          paperId: '44dba1ca30e7a59f101b1ab2',
          title: 'GAMSAT 2020 STYLE',
          questionCount: 137,
          durationMinutes: 270
        }
      ]
    });

    const builtinReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.BUILTIN}`);
    builtinReq.flush({ success: true, data: [] });

    const courses = component.courses();
    // Exactly 2 rows: 2019 (attempted) and 2020 (not started)
    expect(courses.length).toBe(2);

    // 2019 master row displays the active in-progress retest attempt
    const pyq2019 = courses.find((c) => c.title.includes('2019'));
    expect(pyq2019).toBeTruthy();
    expect(pyq2019!.rawStatus).toBe('in_progress');
    expect(pyq2019!.status).toBe('In Progress');
    expect(pyq2019!.progressPercent).toBe(7); // 10 / 137 ~ 7%
    expect(pyq2019!.sessionId).toBe('GAMSAT-PYQ-1788190724641-XGYE5');
    expect(pyq2019!.test_code).toBe('GM-PYQ-2019');

    // 2020 master row displays the untouched available test
    const pyq2020 = courses.find((c) => c.title.includes('2020'));
    expect(pyq2020).toBeTruthy();
    expect(pyq2020!.rawStatus).toBe('not_started');
    expect(pyq2020!.status).toBe('Not Started');
    expect(pyq2020!.progressPercent).toBe(0);
    expect(pyq2020!.test_code).toBe('GM-PYQ-2020');
  });

  it('5. should retest completed test by navigating to start new attempt', () => {
    fixture.detectChanges();

    const summaryReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_SUMMARY}`);
    summaryReq.flush({ success: true, data: {} });

    const filtersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT_FILTERS}`);
    filtersReq.flush({ success: true, data: { sections: [] } });

    const reportReq = httpTesting.expectOne((req) => req.url.includes(API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT));
    reportReq.flush({
      success: true,
      data: {
        tests: [
          {
            id: 'sess-old',
            sessionId: 'GAMSAT-PYQ-OLD-COMPLETED',
            testName: 'GAMSAT 2019 STYLE',
            paperId: '44dba1ca30e7a59f101b1ab1',
            status: 'COMPLETED',
            totalQuestions: 137,
            score: '70 / 137',
            dateModified: '2026-08-30T10:00:00.000Z'
          }
        ]
      }
    });

    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({ success: true, data: [] });

    const builtinReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.BUILTIN}`);
    builtinReq.flush({ success: true, data: [] });

    const courses = component.courses();
    expect(courses.length).toBe(1);

    const completedCourse = courses[0];
    expect(completedCourse.rawStatus).toBe('completed');

    const routerSpy = vi.spyOn((component as any).router, 'navigate');
    component.retestCourse(completedCourse);

    expect(routerSpy).toHaveBeenCalledWith(['/dynamic/gamsat/previous-year'], {
      queryParams: { paperId: '44dba1ca30e7a59f101b1ab1', start: 'true' }
    });
  });

  it('6. should deduplicate catalogue tests and set clean test definition codes', () => {
    fixture.detectChanges();

    const summaryReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_SUMMARY}`);
    summaryReq.flush({ success: true, data: {} });

    const filtersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT_FILTERS}`);
    filtersReq.flush({ success: true, data: { sections: [] } });

    const reportReq = httpTesting.expectOne((req) => req.url.includes(API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT));
    reportReq.flush({
      success: true,
      data: {
        tests: [
          {
            id: 'sess-1',
            sessionId: 'GAMSAT-PYQ-1788194939095-OCVRG',
            testName: 'GAMSAT_2019_STYLE',
            paperId: 'paper-2019',
            status: 'COMPLETED',
            totalQuestions: 137,
            score: '95 / 137'
          }
        ]
      }
    });

    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    // Return duplicated 2020 papers in catalogue to verify deduplication
    papersReq.flush({
      success: true,
      data: [
        {
          id: 'paper-2019',
          paperId: 'paper-2019',
          title: 'GAMSAT 2019 STYLE',
          questionCount: 137,
          durationMinutes: 270
        },
        {
          id: 'paper-2020',
          paperId: 'paper-2020',
          title: 'GAMSAT 2020 STYLE',
          questionCount: 137,
          durationMinutes: 270
        },
        {
          id: 'paper-2020-dup',
          paperId: 'paper-2020-dup',
          title: 'GAMSAT 2020 STYLE',
          questionCount: 137,
          durationMinutes: 270
        }
      ]
    });

    const builtinReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.BUILTIN}`);
    builtinReq.flush({ success: true, data: [] });

    const courses = component.courses();
    // Should have 1 attempted 2019 attempt + 1 deduplicated 2020 available paper = 2 rows
    expect(courses.length).toBe(2);

    const pyq2019Attempt = courses.find((c) => c.sessionId === 'GAMSAT-PYQ-1788194939095-OCVRG');
    expect(pyq2019Attempt).toBeTruthy();
    expect(pyq2019Attempt!.title).toBe('GAMSAT 2019 STYLE');
    expect(pyq2019Attempt!.test_code).toBe('GM-PYQ-2019');
    expect(pyq2019Attempt!.testDefinitionId).toBe('paper-2019');

    const pyq2020Available = courses.find((c) => c.id === 'pyq_2020');
    expect(pyq2020Available).toBeTruthy();
    expect(pyq2020Available!.title).toBe('GAMSAT 2020 STYLE');
    expect(pyq2020Available!.test_code).toBe('GM-PYQ-2020');
    expect(pyq2020Available!.rawStatus).toBe('not_started');
  });

  it('7. should navigate to result view when a completed test row is clicked', () => {
    fixture.detectChanges();

    const summaryReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_SUMMARY}`);
    summaryReq.flush({ success: true, data: {} });

    const filtersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT_FILTERS}`);
    filtersReq.flush({ success: true, data: { sections: [] } });

    const reportReq = httpTesting.expectOne((req) => req.url.includes(API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT));
    reportReq.flush({
      success: true,
      data: {
        tests: [
          {
            id: 'sess-completed',
            sessionId: 'GAMSAT-PYQ-1788191516412-OCUVE',
            testName: 'GAMSAT 2019 STYLE',
            paperId: '44dba1ca30e7a59f101b1ab1',
            status: 'COMPLETED',
            totalQuestions: 137,
            score: '85 / 137'
          }
        ]
      }
    });

    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({ success: true, data: [] });

    const builtinReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.BUILTIN}`);
    builtinReq.flush({ success: true, data: [] });

    const courses = component.courses();
    expect(courses.length).toBe(1);

    const completed = courses[0];
    expect(completed.rawStatus).toBe('completed');
    expect(completed.sessionId).toBe('GAMSAT-PYQ-1788191516412-OCUVE');

    const routerSpy = vi.spyOn((component as any).router, 'navigate');
    component.startOrResumeTest(completed);

    expect(routerSpy).toHaveBeenCalledWith(['/dynamic/gamsat/previous-year'], {
      queryParams: { sessionId: 'GAMSAT-PYQ-1788191516412-OCUVE', view: 'result' }
    });
  });

  it('8. should group 5 retests of the same Previous Year paper into ONE row with the latest score and status', () => {
    fixture.detectChanges();

    const summaryReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_SUMMARY}`);
    summaryReq.flush({ success: true, data: {} });

    const filtersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT_FILTERS}`);
    filtersReq.flush({ success: true, data: { sections: [] } });

    const reportReq = httpTesting.expectOne((req) => req.url.includes(API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT));
    reportReq.flush({
      success: true,
      data: {
        tests: [
          {
            id: 'sess-1',
            sessionId: 'GAMSAT-PYQ-1788194939095-OCVRG',
            testName: 'GAMSAT 2019 STYLE',
            paperId: '44dba1ca30e7a59f101b1ab1',
            status: 'COMPLETED',
            totalQuestions: 137,
            score: '65 / 137',
            dateModified: '2026-08-25T10:00:00.000Z'
          },
          {
            id: 'sess-2',
            sessionId: 'GAMSAT-PYQ-1788193843591-QUT9I',
            testName: 'GAMSAT 2019 STYLE',
            paperId: '44dba1ca30e7a59f101b1ab1',
            status: 'COMPLETED',
            totalQuestions: 137,
            score: '75 / 137',
            dateModified: '2026-08-26T10:00:00.000Z'
          },
          {
            id: 'sess-3',
            sessionId: 'GAMSAT-PYQ-1788191516412-OCUVE',
            testName: 'GAMSAT 2019 STYLE',
            paperId: '44dba1ca30e7a59f101b1ab1',
            status: 'COMPLETED',
            totalQuestions: 137,
            score: '85 / 137',
            dateModified: '2026-08-27T10:00:00.000Z'
          },
          {
            id: 'sess-4',
            sessionId: 'GAMSAT-PYQ-1788190724641-XGYE5',
            testName: 'GAMSAT 2019 STYLE',
            paperId: '44dba1ca30e7a59f101b1ab1',
            status: 'COMPLETED',
            totalQuestions: 137,
            score: '95 / 137',
            dateModified: '2026-08-28T10:00:00.000Z'
          },
          {
            id: 'sess-5',
            sessionId: 'GAMSAT-PYQ-1788156949830-LATEST',
            testName: 'GAMSAT 2019 STYLE',
            paperId: '44dba1ca30e7a59f101b1ab1',
            status: 'COMPLETED',
            totalQuestions: 137,
            score: '110 / 137',
            dateModified: '2026-08-29T10:00:00.000Z'
          }
        ]
      }
    });

    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({
      success: true,
      data: [
        {
          id: '44dba1ca30e7a59f101b1ab1',
          paperId: '44dba1ca30e7a59f101b1ab1',
          title: 'GAMSAT 2019 STYLE',
          questionCount: 137,
          durationMinutes: 270
        }
      ]
    });

    const builtinReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.BUILTIN}`);
    builtinReq.flush({ success: true, data: [] });

    const courses = component.courses();
    // Exactly 1 row for GAMSAT 2019 STYLE
    expect(courses.length).toBe(1);
    expect(courses[0].id).toBe('pyq_2019');
    expect(courses[0].sessionId).toBe('GAMSAT-PYQ-1788156949830-LATEST');
    expect(courses[0].score).toBe('110 / 137');
    expect(courses[0].rawStatus).toBe('completed');
  });

  it('9. should group multiple custom practice tests of the same definition into ONE row', () => {
    fixture.detectChanges();

    const summaryReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_SUMMARY}`);
    summaryReq.flush({ success: true, data: {} });

    const filtersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT_FILTERS}`);
    filtersReq.flush({ success: true, data: { sections: [] } });

    const reportReq = httpTesting.expectOne((req) => req.url.includes(API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT));
    reportReq.flush({
      success: true,
      data: {
        tests: [
          {
            id: 'sess-c1',
            sessionId: 'GAMSAT-1788156949830-ZMSPH',
            testName: 'GAMSAT Practice Test',
            test_type: 'CUSTOM',
            sections: ['SECTION_I'],
            status: 'COMPLETED',
            totalQuestions: 25,
            score: '18 / 25',
            dateModified: '2026-08-28T10:00:00.000Z'
          },
          {
            id: 'sess-c2',
            sessionId: 'GAMSAT-1788156949831-ABCDE',
            testName: 'GAMSAT Practice Test',
            test_type: 'CUSTOM',
            sections: ['SECTION_I'],
            status: 'IN_PROGRESS',
            totalQuestions: 25,
            answeredQuestions: 15,
            dateModified: '2026-08-29T10:00:00.000Z'
          }
        ]
      }
    });

    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({ success: true, data: [] });

    const builtinReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.BUILTIN}`);
    builtinReq.flush({ success: true, data: [] });

    const courses = component.courses();
    // Exactly 1 row for Section I Practice Test, showing active in-progress retest
    expect(courses.length).toBe(1);
    expect(courses[0].id).toBe('custom_sectioni');
    expect(courses[0].sessionId).toBe('GAMSAT-1788156949831-ABCDE');
    expect(courses[0].rawStatus).toBe('in_progress');
    expect(courses[0].progressPercent).toBe(60); // 15 / 25 = 60%
  });

  it('10. should merge built-in test catalogue with existing built-in attempt into exactly ONE row', () => {
    fixture.detectChanges();

    const summaryReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_SUMMARY}`);
    summaryReq.flush({ success: true, data: {} });

    const filtersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT_FILTERS}`);
    filtersReq.flush({ success: true, data: { sections: [] } });

    const reportReq = httpTesting.expectOne((req) => req.url.includes(API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT));
    reportReq.flush({
      success: true,
      data: {
        tests: [
          {
            id: 'sess-blt-attempt',
            sessionId: 'GAMSAT-BLT-12345',
            testId: 'gamsat-mock-1',
            testName: 'GAMSAT Full Mock Exam (Comprehensive)',
            type: 'BUILTIN',
            status: 'COMPLETED',
            totalQuestions: 137,
            score: '90 / 137',
            dateModified: '2026-08-30T10:00:00.000Z'
          }
        ]
      }
    });

    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({ success: true, data: [] });

    const builtinReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.BUILTIN}`);
    builtinReq.flush({
      success: true,
      data: [
        {
          id: 'gamsat-mock-1',
          title: 'GAMSAT Full Mock Exam (Comprehensive)',
          test_type: 'FULL_TEST',
          total_questions: 137,
          duration_minutes: 270
        },
        {
          id: 'gamsat-section1-mock',
          title: 'Section I Practice Test: Written Communication',
          test_type: 'SECTIONAL_TEST',
          total_questions: 50,
          duration_minutes: 100
        }
      ]
    });

    const courses = component.courses();
    // Exactly 2 rows: 1 completed attempt for mock-1 + 1 unattempted for section1-mock
    expect(courses.length).toBe(2);

    const mock1Row = courses.find((c) => c.id === 'builtin_gamsatmock1');
    expect(mock1Row).toBeTruthy();
    expect(mock1Row!.title).toBe('GAMSAT Full Mock Exam (Comprehensive)');
    expect(mock1Row!.type).toBe('BUILT-IN');
    expect(mock1Row!.rawStatus).toBe('completed');
    expect(mock1Row!.sessionId).toBe('GAMSAT-BLT-12345');
    expect(mock1Row!.score).toBe('90 / 137');

    const section1Row = courses.find((c) => c.id === 'builtin_gamsatsection1mock');
    expect(section1Row).toBeTruthy();
    expect(section1Row!.title).toBe('Section I Practice Test: Written Communication');
    expect(section1Row!.type).toBe('BUILT-IN');
    expect(section1Row!.rawStatus).toBe('not_started');
    expect(section1Row!.progressPercent).toBe(0);
  });

  it('11. should render unattempted built-in tests as Not Started rows from the catalogue', () => {
    fixture.detectChanges();

    const summaryReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_SUMMARY}`);
    summaryReq.flush({ success: true, data: {} });

    const filtersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT_FILTERS}`);
    filtersReq.flush({ success: true, data: { sections: [] } });

    const reportReq = httpTesting.expectOne((req) => req.url.includes(API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT));
    reportReq.flush({ success: true, data: { tests: [] } });

    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({ success: true, data: [] });

    const builtinReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.BUILTIN}`);
    builtinReq.flush({
      success: true,
      data: [
        {
          id: 'gamsat-mock-1',
          title: 'GAMSAT Full Mock Exam (Comprehensive)',
          test_type: 'FULL_TEST',
          total_questions: 137,
          duration_minutes: 270
        },
        {
          id: 'gamsat-section1-mock',
          title: 'Section I Practice Test: Written Communication',
          test_type: 'SECTIONAL_TEST',
          total_questions: 50,
          duration_minutes: 100
        },
        {
          id: 'gamsat-section2-mock',
          title: 'Section II Practice Test: Humanities & Social Sciences',
          test_type: 'SECTIONAL_TEST',
          total_questions: 50,
          duration_minutes: 100
        },
        {
          id: 'gamsat-section3-mock',
          title: 'Section III Practice Test: Biological & Physical Sciences',
          test_type: 'SECTIONAL_TEST',
          total_questions: 75,
          duration_minutes: 150
        }
      ]
    });

    const courses = component.courses();
    // All 4 built-in tests appear as Not Started
    expect(courses.length).toBe(4);
    expect(courses.every((c) => c.rawStatus === 'not_started')).toBe(true);
    expect(courses.every((c) => c.type === 'BUILT-IN')).toBe(true);
  });

  it('12. should not duplicate rows on refresh or re-fetch', () => {
    fixture.detectChanges();

    const summaryReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_SUMMARY}`);
    summaryReq.flush({ success: true, data: {} });

    const filtersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT_FILTERS}`);
    filtersReq.flush({ success: true, data: { sections: [] } });

    const reportReq = httpTesting.expectOne((req) => req.url.includes(API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT));
    reportReq.flush({
      success: true,
      data: {
        tests: [
          {
            id: 'sess-1',
            sessionId: 'GAMSAT-PYQ-1',
            testName: 'GAMSAT 2019 STYLE',
            paperId: 'pyq-2019',
            status: 'COMPLETED'
          }
        ]
      }
    });

    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({
      success: true,
      data: [
        {
          id: 'pyq-2019',
          paperId: 'pyq-2019',
          title: 'GAMSAT 2019 STYLE'
        }
      ]
    });

    const builtinReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.BUILTIN}`);
    builtinReq.flush({
      success: true,
      data: [
        {
          id: 'gamsat-mock-1',
          title: 'GAMSAT Full Mock Exam (Comprehensive)',
          test_type: 'FULL_TEST'
        }
      ]
    });

    expect(component.courses().length).toBe(2);

    // Trigger re-fetch (simulating user refresh / filter reload)
    component.loadReport(1);

    const reportReq2 = httpTesting.expectOne((req) => req.url.includes(API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT));
    reportReq2.flush({
      success: true,
      data: {
        tests: [
          {
            id: 'sess-1',
            sessionId: 'GAMSAT-PYQ-1',
            testName: 'GAMSAT 2019 STYLE',
            paperId: 'pyq-2019',
            status: 'COMPLETED'
          }
        ]
      }
    });

    const papersReq2 = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq2.flush({
      success: true,
      data: [
        {
          id: 'pyq-2019',
          paperId: 'pyq-2019',
          title: 'GAMSAT 2019 STYLE'
        }
      ]
    });

    const builtinReq2 = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.BUILTIN}`);
    builtinReq2.flush({
      success: true,
      data: [
        {
          id: 'gamsat-mock-1',
          title: 'GAMSAT Full Mock Exam (Comprehensive)',
          test_type: 'FULL_TEST'
        }
      ]
    });

    expect(component.courses().length).toBe(2);
  });

  it('13. should display newly saved custom test as Not Started course row with 0% progress and Start Test action', () => {
    localStorage.setItem('gamsat_saved_custom_tests', JSON.stringify([
      {
        title: 'GAMSAT Custom Biology Drill',
        sections: ['SECTION_III'],
        topic_ids: [3010, 3011],
        questionCount: 30,
        duration: 60,
        difficulty: 'Hard',
        level: 'Advanced'
      }
    ]));

    fixture.detectChanges();

    const summaryReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_SUMMARY}`);
    summaryReq.flush({ success: true, data: {} });

    const filtersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT_FILTERS}`);
    filtersReq.flush({ success: true, data: { sections: [] } });

    const reportReq = httpTesting.expectOne((req) => req.url.includes(API.STUDENT_DASHBOARD.GAMSAT_LEARNING_REPORT));
    reportReq.flush({ success: true, data: { tests: [] } });

    const papersReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.PREVIOUS_YEAR_TEST.PAPERS}`);
    papersReq.flush({ success: true, data: [] });

    const builtinReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.BUILTIN}`);
    builtinReq.flush({ success: true, data: [] });

    const courses = component.courses();
    expect(courses.length).toBe(1);

    const customCourse = courses[0];
    expect(customCourse.title).toBe('GAMSAT Custom Biology Drill');
    expect(customCourse.type).toBe('CUSTOM TEST');
    expect(customCourse.source).toBe('custom');
    expect(customCourse.rawStatus).toBe('not_started');
    expect(customCourse.status).toBe('Not Started');
    expect(customCourse.progressPercent).toBe(0);
    expect(customCourse.score).toBe('—');
    expect(customCourse.learningTime).toBe('0m');
    expect(customCourse.level).toBe('Hard');
  });

  it('14. should call POST /gamsat/test/start and navigate with real sessionId when Start Test is clicked on custom course', () => {
    const customCourse = {
      id: 'custom_gamsatcustombiologydrill',
      test_id: 0,
      test_code: 'GM-TEST-CUSTOM',
      dateModifiedTimestamp: 0,
      title: 'GAMSAT Custom Biology Drill',
      type: 'CUSTOM TEST',
      source: 'custom' as const,
      stagesCount: '30 Questions',
      level: 'Hard',
      status: 'Not Started',
      rawStatus: 'not_started' as const,
      stageInfo: '30 Questions · 60m',
      progressPercent: 0,
      progressColor: '#e2e8f0',
      dateRange: 'Available',
      dateModified: 'Available',
      learningTime: '0m',
      score: '—',
      scoreNum: 0,
      category: 'Biological & Physical Sciences',
      iconBg: '#f59e0b',
      iconName: 'sparkles',
      rawItem: {
        title: 'GAMSAT Custom Biology Drill',
        testName: 'GAMSAT Custom Biology Drill',
        source: 'custom',
        type: 'CUSTOM',
        status: 'not_started',
        durationMinutes: 60,
        totalQuestions: 30,
        sections: ['SECTION_III'],
        topic_ids: [3010, 3011],
        difficulty: 'Hard',
        level: 'Advanced'
      }
    };

    const routerSpy = vi.spyOn((component as any).router, 'navigate');

    component.startTest(customCourse);
    expect(component.startingTestId()).toBe('custom_gamsatcustombiologydrill');

    const startReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.START}`);
    expect(startReq.request.method).toBe('POST');
    expect(startReq.request.body.title).toBe('GAMSAT Custom Biology Drill');
    expect(startReq.request.body.total_questions).toBe(30);
    expect(startReq.request.body.duration).toBe(60);
    expect(startReq.request.body.difficulty).toBe('Hard');
    expect(startReq.request.body.test_type).toBe('CUSTOM');

    startReq.flush({
      success: true,
      sessionId: 'GAMSAT-1799200000000-BIO',
      duration: 60,
      totalQuestions: 30,
      status: 'IN_PROGRESS'
    });

    expect(component.startingTestId()).toBeNull();
    expect(routerSpy).toHaveBeenCalledWith(['/dynamic/gamsat/practice'], {
      queryParams: { sessionId: 'GAMSAT-1799200000000-BIO' }
    });
  });
});
