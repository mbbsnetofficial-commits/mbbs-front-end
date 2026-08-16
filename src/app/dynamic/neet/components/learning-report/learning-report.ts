import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Icon } from '../../../../shared/ui/icon/icon';
import { QuickTest } from '../quick-test/quick-test';
import {
  NeetModalService,
  SavedTestPayload
} from '../../services/neet-modal.service';
import { LearningReportService } from '../../services/learning-report.service';
import { PreviousYearTestService } from '../../services/previous-year.service';
import {
  LearningReportItem,
  LearningReportQueryParams,
  NeetSummaryData
} from '../../models/learning-report.model';
import { TestStartRequest } from '../../models/previous-year.model';

export interface NeetCourseItem {
  id: string;
  test_id: number;
  test_code: string;
  title: string;
  type: string;
  stagesCount: string;
  level: string;
  status: string;
  rawStatus: 'not_started' | 'in_progress' | 'completed';
  stageInfo: string;
  progressPercent: number;
  progressColor: string;
  dateRange: string;
  dateModified: string;
  dateModifiedTimestamp: number;
  learningTime: string;
  score: string;
  scoreNum: number;
  category: string;
  iconBg: string;
  iconName: string;
  rawItem?: LearningReportItem;
}

@Component({
  selector: 'app-learning-report',
  standalone: true,
  imports: [
    Icon,
    FormsModule,
    QuickTest
  ],
  templateUrl: './learning-report.html',
  styleUrl: './learning-report.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LearningReport implements OnInit {
  private readonly elementRef = inject(ElementRef);
  private readonly router = inject(Router);
  private readonly neetModalService = inject(NeetModalService);
  private readonly learningReportService = inject(LearningReportService);
  private readonly previousYearTestService = inject(PreviousYearTestService);

  readonly searchQuery = signal('');
  readonly activeTab = signal<'all' | 'in_progress' | 'completed'>('all');
  readonly filterDropdownOpen = signal(false);
  readonly activeTestModalCourse = signal<NeetCourseItem | null>(null);
  readonly startingTestId = signal<string | number | null>(null);

  readonly summary = signal<NeetSummaryData | null>(null);
  readonly isSummaryLoading = signal(false);
  readonly summaryError = signal<string | null>(null);

  readonly isLoading = signal(false);
  readonly isLoadingMore = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly totalPages = signal(1);
  readonly totalCount = signal(0);
  readonly hasMore = signal(true);

  readonly sortField = signal<'date' | 'score' | 'progress' | 'title'>('date');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  readonly availableCategories = signal([
    'Previous Year Test',
    'Practise Test',
    'Custom',
    'Physics',
    'Chemistry',
    'Botany',
    'Zoology'
  ]);

  readonly activeCategories = signal<string[]>([]);
  readonly courses = signal<NeetCourseItem[]>([]);

  readonly filteredCourses = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const list = this.courses();

    if (!query) {
      return list;
    }

    return list.filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        item.level.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    });
  });

  constructor() {
    effect(() => {
      const payload = this.neetModalService.newlySavedTest();
      if (payload) {
        this.addSavedTestToTable(payload);
      }
    });
  }

  ngOnInit(): void {
    this.loadSummary();
    this.loadReport(false);
  }

  loadSummary(): void {
    this.isSummaryLoading.set(true);
    this.summaryError.set(null);

    this.learningReportService.getNeetSummary().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data) {
          this.summary.set(response.data);
        }
        this.isSummaryLoading.set(false);
      },
      error: (error) => {
        this.summary.set(null);
        this.summaryError.set(
          error?.error?.message ||
            error?.message ||
            'Unable to load NEET summary.'
        );
        this.isSummaryLoading.set(false);
      }
    });
  }

  loadReport(isAppend: boolean = false): void {
    if (isAppend) {
      if (this.isLoading() || this.isLoadingMore() || !this.hasMore()) {
        return;
      }
      this.isLoadingMore.set(true);
    } else {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.currentPage.set(1);
      this.hasMore.set(true);
    }

    const targetPage = isAppend ? this.currentPage() + 1 : 1;

    const queryParams: LearningReportQueryParams = {
      status: this.activeTab() === 'all' ? undefined : this.activeTab(),
      type:
        this.activeCategories().length === 1
          ? this.activeCategories()[0]
          : undefined,
      sortBy: this.sortField(),
      sortOrder: this.sortDirection(),
      page: targetPage,
      limit: this.pageSize()
    };

    this.learningReportService.getLearningReport(queryParams).subscribe({
      next: (response) => {
        const rawItems = Array.isArray(response.data) ? response.data : [];
        const mapped = rawItems.map((item) => this.mapReportItem(item));

        if (isAppend) {
          this.courses.update((current) => [...current, ...mapped]);
          this.currentPage.set(targetPage);
        } else {
          this.courses.set(mapped);
          this.currentPage.set(1);
        }

        const pagination = response.pagination;
        const totalP = pagination?.totalPages ?? (rawItems.length < this.pageSize() ? targetPage : targetPage + 1);
        const total = pagination?.total ?? (isAppend ? this.courses().length : mapped.length);

        this.totalPages.set(totalP);
        this.totalCount.set(total);
        this.hasMore.set(targetPage < totalP && rawItems.length >= this.pageSize());

        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
      error: (error) => {
        if (!isAppend) {
          this.errorMessage.set(
            error?.error?.message ||
              error?.message ||
              'Unable to load NEET learning report. Please try again.'
          );
        }
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      }
    });
  }

  loadMore(): void {
    if (this.hasMore() && !this.isLoading() && !this.isLoadingMore()) {
      this.loadReport(true);
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (this.isLoading() || this.isLoadingMore() || !this.hasMore()) {
      return;
    }

    const threshold = 350;
    const windowHeight = window.innerHeight;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const fullHeight = document.documentElement.scrollHeight;

    if (windowHeight + scrollY >= fullHeight - threshold) {
      this.loadMore();
    }
  }

  onTableContainerScroll(event: Event): void {
    const element = event.target as HTMLElement;
    if (!element || this.isLoading() || this.isLoadingMore() || !this.hasMore()) {
      return;
    }

    const threshold = 150;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + threshold) {
      this.loadMore();
    }
  }

  private mapReportItem(item: LearningReportItem): NeetCourseItem {
    const title = item.course_name?.title || item.test_name || 'NEET Test';
    const category =
      item.course_name?.subtitle || `${item.type || 'NEET'} Practice`;

    let statusDisplay: 'Not Started' | 'In Progress' | 'Completed' = 'In Progress';
    if (item.status === 'completed') {
      statusDisplay = 'Completed';
    } else if (item.status === 'not_started') {
      statusDisplay = 'Not Started';
    }

    const progressPercent = typeof item.progress === 'number' ? item.progress : 0;
    let progressColor = '#ff5252';
    if (progressPercent >= 100) progressColor = '#34d399';
    else if (progressPercent >= 75) progressColor = '#2979ff';
    else if (progressPercent >= 40) progressColor = '#ff9800';

    const scoreDisplay = item.score?.formatted
      ? item.score.formatted
      : item.score?.earned !== undefined
        ? `${item.score.earned} / ${item.score.total_marks || item.total_marks || 720}`
        : '—';

    const scoreNum = item.score?.earned ?? 0;
    const timeSpentDisplay = item.time_spent || '0m';
    const dateModifiedDisplay = item.date_modified || 'Not Attempted';

    return {
      id: item.id?.toString() || item.test_id?.toString() || title,
      test_id: item.test_id || item.id,
      test_code: item.test_code || '',
      title,
      type: item.type || 'Custom',
      stagesCount: `${item.total_questions || 180} Questions`,
      level: item.level || 'Intermediate',
      status: statusDisplay,
      rawStatus: item.status || 'in_progress',
      stageInfo: item.source === 'previous_year' ? 'Previous Year' : 'Built-in',
      progressPercent,
      progressColor,
      dateRange: dateModifiedDisplay,
      dateModified: dateModifiedDisplay,
      dateModifiedTimestamp: item.lastModifiedAt
        ? new Date(item.lastModifiedAt).getTime()
        : 0,
      learningTime: timeSpentDisplay,
      score: scoreDisplay,
      scoreNum,
      category,
      iconBg: this.getIconBg(item.type),
      iconName: this.getIconName(item.type),
      rawItem: item
    };
  }

  private getIconBg(type: string): string {
    const map: Record<string, string> = {
      Physics: '#42a5f5',
      Chemistry: '#ff6b4a',
      Botany: '#34d399',
      Zoology: '#ff4081',
      'Previous Year Test': '#7e57c2',
      'Practise Test': '#26c6da',
      Custom: '#f59e0b'
    };
    return map[type] || '#f05a28';
  }

  private getIconName(type: string): string {
    const map: Record<string, string> = {
      Physics: 'flame',
      Chemistry: 'sparkles',
      Botany: 'bookmark',
      Zoology: 'check',
      'Previous Year Test': 'test',
      'Practise Test': 'test',
      Custom: 'sparkles'
    };
    return map[type] || 'test';
  }

  addSavedTestToTable(payload: SavedTestPayload): void {
    const typeVal =
      payload.subjects.length === 1 ? payload.subjects[0] : 'Custom';

    const nowTs = Date.now();
    const newCourse: NeetCourseItem = {
      id: nowTs.toString(),
      test_id: nowTs,
      test_code: 'CUSTOM_TEST',
      title: payload.title || 'NEET Custom Practice Test',
      type: typeVal,
      stagesCount: `${payload.chapters.length} Chapters`,
      level: 'Intermediate',
      status: 'In Progress',
      rawStatus: 'in_progress',
      stageInfo: 'Stage 1',
      progressPercent: 0,
      progressColor: '#ff5252',
      dateRange: 'Just now',
      dateModified: 'Just now',
      dateModifiedTimestamp: nowTs,
      learningTime: '0m',
      score: '—',
      scoreNum: 0,
      category: `${payload.subjects.join(', ')} • ${payload.questionCount} Qs`,
      iconBg: '#f05a28',
      iconName: 'sparkles'
    };

    // Prepend to top of table
    this.courses.update((current) => [newCourse, ...current]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.filterDropdownOpen()) return;
    const target = event.target as HTMLElement;
    const dropdownWrap = this.elementRef.nativeElement.querySelector(
      '.filter-dropdown-wrap'
    );
    if (dropdownWrap && !dropdownWrap.contains(target)) {
      this.filterDropdownOpen.set(false);
    }
  }

  startCourseTest(course: NeetCourseItem): void {
    if (course.rawStatus === 'not_started') {
      this.onStartTest(course);
    } else if (course.rawStatus === 'in_progress') {
      this.onContinueTest(course);
    }
  }

  onStartTest(course: NeetCourseItem, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.startingTestId() !== null) {
      return;
    }

    const testId = course.test_id;
    const isPreviousYear =
      course.rawItem?.source === 'previous_year' ||
      course.type === 'Previous Year Test';

    let request: TestStartRequest;
    if (isPreviousYear) {
      request = {
        previous_year_paper_id: course.rawItem?.test_id ?? testId
      };
    } else {
      request = {
        builtin_test_id: course.rawItem?.test_id ?? testId
      };
    }

    this.startingTestId.set(course.id);
    this.errorMessage.set(null);

    this.previousYearTestService.startTest(request).subscribe({
      next: (response) => {
        if (!response.sessionId || !response.data?.length) {
          this.errorMessage.set('The test could not be started with any questions.');
          this.startingTestId.set(null);
          return;
        }

        const startedAt = Date.now();
        const durationMinutes = response.duration || 180;
        const durationSeconds = durationMinutes * 60;
        const states = response.data.map((question, index) => ({
          questionId: question.id,
          selectedOption: null,
          timeSpent: 0,
          markedForReview: false,
          visited: index === 0
        }));

        const activeSession = {
          sessionId: response.sessionId,
          paper: {
            id: testId,
            name: response.title || course.title,
            exam_type: 'neet'
          },
          duration: durationMinutes,
          totalQuestions: response.totalQuestions || response.data.length,
          startedAt,
          expiresAt: startedAt + durationSeconds * 1000,
          questions: response.data,
          questionStates: states,
          currentQuestionIndex: 0
        };

        try {
          sessionStorage.setItem(
            'activePreviousYearTest',
            JSON.stringify(activeSession)
          );
        } catch {}

        this.startingTestId.set(null);
        this.router.navigate(['/dynamic/neet/previous-year-tests']);
      },
      error: (error) => {
        this.errorMessage.set(
          error?.error?.message ||
            error?.message ||
            'Unable to start test. Please try again.'
        );
        this.startingTestId.set(null);
      }
    });
  }

  onContinueTest(course: NeetCourseItem, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    const item = course.rawItem;
    const sessionId =
      item?.activeSessionId ||
      item?.active_session_id ||
      item?.sessionId ||
      item?.session_id;

    if (!sessionId) {
      this.errorMessage.set('No active session found to continue this test.');
      return;
    }

    if (this.startingTestId() !== null) {
      return;
    }

    this.startingTestId.set(course.id);
    this.errorMessage.set(null);

    this.previousYearTestService.getTestSession(sessionId).subscribe({
      next: (response) => {
        const rawResponse = response as any;
        const sessionData = rawResponse?.data || rawResponse;

        const resolvedSessionId =
          sessionData?.sessionId ||
          sessionData?.session_id ||
          sessionData?.id ||
          rawResponse?.sessionId ||
          sessionId;

        const rawQuestions =
          sessionData?.questions ||
          sessionData?.data ||
          rawResponse?.data?.questions ||
          rawResponse?.questions ||
          (Array.isArray(sessionData) ? sessionData : []);

        const resolvedQuestions = Array.isArray(rawQuestions) ? rawQuestions : [];

        if (!resolvedSessionId || !resolvedQuestions.length) {
          this.errorMessage.set('Unable to restore this test session.');
          this.startingTestId.set(null);
          return;
        }

        const durationMinutes =
          sessionData?.duration ||
          sessionData?.duration_minutes ||
          sessionData?.durationMinutes ||
          course.rawItem?.duration_minutes ||
          180;

        const remainingSeconds =
          typeof sessionData?.remaining_time_seconds === 'number'
            ? sessionData.remaining_time_seconds
            : typeof sessionData?.remainingTimeSeconds === 'number'
              ? sessionData.remainingTimeSeconds
              : durationMinutes * 60;

        const now = Date.now();
        const timeSpentSeconds =
          typeof sessionData?.time_spent_seconds === 'number'
            ? sessionData.time_spent_seconds
            : typeof sessionData?.timeSpentSeconds === 'number'
              ? sessionData.timeSpentSeconds
              : 0;

        const startedAt = timeSpentSeconds > 0 ? now - timeSpentSeconds * 1000 : now;
        const expiresAt = now + remainingSeconds * 1000;

        const rawAnswers =
          sessionData?.answers ||
          sessionData?.saved_answers ||
          rawResponse?.answers ||
          [];

        const answersMap = new Map<number, string>();
        const answerTimeMap = new Map<number, number>();
        if (Array.isArray(rawAnswers)) {
          for (const ans of rawAnswers) {
            const qId = ans?.question_id ?? ans?.questionId ?? ans?.id;
            const opt = ans?.selected_option ?? ans?.selectedOption ?? ans?.option;
            if (qId !== undefined && opt !== undefined && opt !== null) {
              answersMap.set(Number(qId), String(opt));
            }
            const timeSpent = ans?.time_spent ?? ans?.timeSpent;
            if (typeof timeSpent === 'number') {
              answerTimeMap.set(Number(qId), timeSpent);
            }
          }
        }

        const states = resolvedQuestions.map((q: any, idx: number) => {
          const qId = Number(q.id);
          const isAnswered = answersMap.has(qId);
          return {
            questionId: qId,
            selectedOption: (answersMap.get(qId) as any) || null,
            timeSpent: answerTimeMap.get(qId) || 0,
            markedForReview: false,
            visited: isAnswered || idx === 0
          };
        });

        const activeSession = {
          sessionId: resolvedSessionId,
          paper: {
            id: course.test_id,
            name: sessionData?.title || course.title,
            exam_type: 'neet'
          },
          duration: durationMinutes,
          totalQuestions:
            sessionData?.total_questions ||
            sessionData?.totalQuestions ||
            resolvedQuestions.length,
          startedAt,
          expiresAt,
          questions: resolvedQuestions,
          questionStates: states,
          currentQuestionIndex: 0
        };

        try {
          sessionStorage.setItem(
            'activePreviousYearTest',
            JSON.stringify(activeSession)
          );
        } catch {}

        this.startingTestId.set(null);
        this.router.navigate(['/dynamic/neet/previous-year-tests']);
      },
      error: (error) => {
        this.errorMessage.set(
          error?.error?.message ||
            error?.message ||
            'Unable to resume test. Please try again.'
        );
        this.startingTestId.set(null);
      }
    });
  }

  closeCourseTestModal(): void {
    this.activeTestModalCourse.set(null);
  }

  toggleSort(field: 'date' | 'score' | 'progress' | 'title'): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('desc');
    }
    this.loadReport(false);
  }

  setTab(tab: 'all' | 'in_progress' | 'completed'): void {
    this.activeTab.set(tab);
    this.loadReport(false);
  }

  toggleCategory(category: string): void {
    this.activeCategories.update((current) => {
      if (current.includes(category)) {
        return current.filter((c) => c !== category);
      }
      return [...current, category];
    });
    this.loadReport(false);
  }

  removeCategory(category: string): void {
    this.activeCategories.update((current) =>
      current.filter((c) => c !== category)
    );
    this.loadReport(false);
  }

  toggleFilterDropdown(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.filterDropdownOpen.update((val) => !val);
  }

  isCategorySelected(cat: string): boolean {
    return this.activeCategories().includes(cat);
  }
}

export { LearningReport as NeetComponent };
