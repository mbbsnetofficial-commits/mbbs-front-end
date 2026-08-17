import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
  untracked
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Icon } from '../../../../shared/ui/icon/icon';
import { UcatLearningReportService } from '../../services/ucat-learning-report.service';
import { UcatModalService } from '../../services/ucat-modal.service';
import { UcatService } from '../../services/ucat.service';
import { UcatPreviousYearService } from '../../services/ucat-previous-year.service';
import {
  UcatActiveSession,
  UcatOption,
  UcatQuestion,
  UcatQuestionState,
  UcatStartTestRequest,
  UcatStartTestResponse
} from '../../models/ucat.model';
import { UcatStartPreviousYearTestRequest } from '../../models/ucat-previous-year.model';
import {
  UcatLearningReportItem,
  UcatLearningReportQueryParams,
  UcatSummaryData
} from '../../models/ucat-learning-report.model';

export interface UcatCourseItem {
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
  rawItem?: UcatLearningReportItem;
}

@Component({
  selector: 'app-ucat-learning-report',
  standalone: true,
  imports: [
    Icon,
    FormsModule
  ],
  templateUrl: './learning-report.html',
  styleUrl: './learning-report.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UcatLearningReport implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('paginationSentinel') sentinelRef?: ElementRef<HTMLElement>;

  private readonly elementRef = inject(ElementRef);
  private readonly router = inject(Router);
  private readonly learningReportService = inject(UcatLearningReportService);
  private readonly ucatModalService = inject(UcatModalService);
  private readonly ucatService = inject(UcatService);
  private readonly previousYearService = inject(UcatPreviousYearService);
  private observer: IntersectionObserver | null = null;

  readonly searchQuery = signal('');
  readonly activeTab = signal<'all' | 'in_progress' | 'completed'>('all');
  readonly filterDropdownOpen = signal(false);
  readonly startingTestId = signal<string | number | null>(null);

  readonly summary = signal<UcatSummaryData | null>(null);
  readonly isSummaryLoading = signal(false);
  readonly summaryError = signal<string | null>(null);

  readonly isLoading = signal(false);
  readonly isLoadingMore = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly totalPages = signal(1);
  readonly totalCount = signal(0);
  readonly hasMore = signal(false);

  readonly sortField = signal<'date' | 'score' | 'progress' | 'title'>('date');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  readonly availableCategories = signal([
    'Previous Year Test',
    'Practise Test',
    'Custom',
    'Verbal Reasoning',
    'Decision Making',
    'Quantitative Reasoning',
    'Abstract Reasoning',
    'Situational Judgement'
  ]);

  readonly activeCategories = signal<string[]>([]);
  readonly courses = signal<UcatCourseItem[]>([]);

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
      const payload = this.ucatModalService.newlySavedTest();
      if (payload) {
        untracked(() => {
          this.ucatModalService.newlySavedTest.set(null);
          this.loadReport(false);
        });
      }
    });
  }

  triggerBuildTestModal(event?: MouseEvent): void {
    if (event) event.preventDefault();
    this.ucatModalService.openBuildTestModal();
  }

  ngOnInit(): void {
    this.loadSummary();
    this.loadReport(false);
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private setupIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.observer?.disconnect();

    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry?.isIntersecting &&
          this.hasMore() &&
          !this.isLoading() &&
          !this.isLoadingMore() &&
          this.courses().length > 0
        ) {
          this.loadMore();
        }
      },
      {
        root: null,
        rootMargin: '0px 0px 200px 0px',
        threshold: 0
      }
    );

    const sentinel =
      this.sentinelRef?.nativeElement ||
      this.elementRef.nativeElement.querySelector('#pagination-sentinel');
    if (sentinel) {
      this.observer.observe(sentinel);
    }
  }

  loadSummary(): void {
    this.isSummaryLoading.set(true);
    this.summaryError.set(null);

    this.learningReportService.getUcatSummary().subscribe({
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
            'Unable to load UCAT summary.'
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
      if (this.isLoading()) {
        return;
      }
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.currentPage.set(1);
      this.hasMore.set(false);
    }

    const targetPage = isAppend ? this.currentPage() + 1 : 1;

    const queryParams: UcatLearningReportQueryParams = {
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

    this.learningReportService.getUcatLearningReport(queryParams).subscribe({
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
        const totalP =
          pagination?.totalPages ??
          (rawItems.length < this.pageSize() ? targetPage : targetPage + 1);
        const total =
          pagination?.total ??
          (isAppend ? this.courses().length : mapped.length);

        this.totalPages.set(totalP);
        this.totalCount.set(total);
        const hasNext = pagination
          ? targetPage < totalP
          : rawItems.length >= this.pageSize() && rawItems.length > 0;
        this.hasMore.set(hasNext);

        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
      error: (error) => {
        if (!isAppend) {
          this.errorMessage.set(
            error?.error?.message ||
              error?.message ||
              'Unable to load UCAT learning report. Please try again.'
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

    const threshold = 400;
    const windowHeight = window.innerHeight;
    const scrollY =
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    const fullHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    );

    if (windowHeight + scrollY >= fullHeight - threshold) {
      this.loadMore();
    }
  }

  private mapReportItem(item: UcatLearningReportItem): UcatCourseItem {
    const title = item.course_name?.title || item.test_name || 'UCAT Test';
    const category =
      item.course_name?.subtitle || `${item.type || 'UCAT'} Practice`;

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
        ? `${item.score.earned} / ${item.score.total_marks || item.total_marks || 3600}`
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
      stagesCount: `${item.total_questions || 0} Questions`,
      level: item.level || 'Intermediate',
      status: statusDisplay,
      rawStatus: item.status || 'in_progress',
      stageInfo:
        item.source === 'previous_year'
          ? 'Previous Year'
          : item.source === 'custom'
            ? 'Custom'
            : 'Built-in',
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
      'Verbal Reasoning': '#42a5f5',
      'Decision Making': '#ff6b4a',
      'Quantitative Reasoning': '#34d399',
      'Abstract Reasoning': '#ff4081',
      'Situational Judgement': '#7e57c2',
      'Previous Year Test': '#7e57c2',
      'Practise Test': '#26c6da',
      Custom: '#f59e0b'
    };
    return map[type] || '#f05a28';
  }

  private getIconName(type: string): string {
    const map: Record<string, string> = {
      'Verbal Reasoning': 'flame',
      'Decision Making': 'sparkles',
      'Quantitative Reasoning': 'check',
      'Abstract Reasoning': 'bookmark',
      'Situational Judgement': 'test',
      'Previous Year Test': 'test',
      'Practise Test': 'test',
      Custom: 'sparkles'
    };
    return map[type] || 'test';
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

  startCourseTest(course: UcatCourseItem): void {
    if (course.rawStatus === 'not_started' || course.rawStatus === 'completed') {
      this.onStartTest(course);
    } else if (course.rawStatus === 'in_progress') {
      this.onContinueTest(course);
    }
  }

  private normalizeUcatSubjects(typeOrSubjects: string | string[] | undefined): string[] {
    const allSubjects = [
      'VERBAL_REASONING',
      'DECISION_MAKING',
      'QUANTITATIVE_REASONING',
      'ABSTRACT_REASONING',
      'SITUATIONAL_JUDGEMENT'
    ];

    if (!typeOrSubjects) {
      return allSubjects;
    }

    const items = Array.isArray(typeOrSubjects) ? typeOrSubjects : [typeOrSubjects];
    const mapped: string[] = [];

    for (const raw of items) {
      if (!raw || typeof raw !== 'string') continue;
      const clean = raw.trim();
      const upper = clean.toUpperCase().replace(/\s+/g, '_');

      if (allSubjects.includes(upper)) {
        if (!mapped.includes(upper)) mapped.push(upper);
        continue;
      }

      if (clean.toLowerCase().includes('verbal')) {
        if (!mapped.includes('VERBAL_REASONING')) mapped.push('VERBAL_REASONING');
      } else if (clean.toLowerCase().includes('decision')) {
        if (!mapped.includes('DECISION_MAKING')) mapped.push('DECISION_MAKING');
      } else if (clean.toLowerCase().includes('quantitative')) {
        if (!mapped.includes('QUANTITATIVE_REASONING')) mapped.push('QUANTITATIVE_REASONING');
      } else if (clean.toLowerCase().includes('abstract')) {
        if (!mapped.includes('ABSTRACT_REASONING')) mapped.push('ABSTRACT_REASONING');
      } else if (
        clean.toLowerCase().includes('situational') ||
        clean.toLowerCase().includes('judgement') ||
        clean.toLowerCase().includes('judgment')
      ) {
        if (!mapped.includes('SITUATIONAL_JUDGEMENT')) mapped.push('SITUATIONAL_JUDGEMENT');
      } else if (
        clean.toLowerCase().includes('practise') ||
        clean.toLowerCase().includes('practice') ||
        clean.toLowerCase().includes('mock') ||
        clean.toLowerCase().includes('full')
      ) {
        return allSubjects;
      } else {
        if (!mapped.includes(upper)) mapped.push(upper);
      }
    }

    return mapped.length > 0 ? mapped : allSubjects;
  }

  onStartTest(course: UcatCourseItem, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.startingTestId() !== null) {
      return;
    }

    const testId = course.test_id;
    const isPreviousYear =
      course.rawItem?.source === 'previous_year' ||
      course.type === 'Previous Year Test' ||
      course.category === 'Previous Year';
    const isCustom =
      course.rawItem?.source === 'custom' ||
      course.type === 'Custom' ||
      course.type === 'Custom Test' ||
      course.category === 'Custom Test' ||
      course.category === 'Custom' ||
      course.rawItem?.custom_test_id !== undefined;

    this.startingTestId.set(course.id);
    this.errorMessage.set(null);

    if (isPreviousYear) {
      const paperId = course.rawItem?.previous_year_paper_id ?? course.rawItem?.test_id ?? testId;
      const numericPaperId = typeof paperId === 'string' && !isNaN(Number(paperId)) ? Number(paperId) : paperId;
      const payload: UcatStartPreviousYearTestRequest = {
        limit: course.rawItem?.total_questions || 30,
        duration: course.rawItem?.duration_minutes || 120
      };

      this.previousYearService.startPreviousYearTest(numericPaperId, payload).subscribe({
        next: (response) => {
          this.handleStartSuccess(response, course, 'activeUcatPreviousYearTest', '/dynamic/ucat/previous-year');
        },
        error: (error) => {
          this.handleStartError(error);
        }
      });
    } else {
      let request: UcatStartTestRequest;
      if (isCustom) {
        const rawCustomId = course.rawItem?.custom_test_id ?? course.rawItem?.test_id ?? testId;
        const customId = typeof rawCustomId === 'string' && !isNaN(Number(rawCustomId)) ? Number(rawCustomId) : rawCustomId;
        const subjects = this.normalizeUcatSubjects(course.rawItem?.subjects || course.type);
        request = {
          custom_test_id: customId,
          subjects,
          chapters: course.rawItem?.chapters || [],
          topic_ids: course.rawItem?.topic_ids || [],
          limit: course.rawItem?.total_questions || 20,
          duration: course.rawItem?.duration_minutes || 15
        };
      } else {
        const subjects = this.normalizeUcatSubjects(course.rawItem?.subjects || course.type);
        const rawBuiltinId = course.rawItem?.builtin_test_id ?? course.rawItem?.platform_test_id ?? (typeof course.rawItem?.test_id === 'number' ? course.rawItem.test_id : undefined);
        request = {
          builtin_test_id: typeof rawBuiltinId === 'string' && !isNaN(Number(rawBuiltinId)) ? Number(rawBuiltinId) : rawBuiltinId,
          subjects,
          chapters: course.rawItem?.chapters || [],
          topic_ids: course.rawItem?.topic_ids || [],
          limit: course.rawItem?.total_questions || 20,
          duration: course.rawItem?.duration_minutes || 15
        };
      }

      this.ucatService.startTest(request).subscribe({
        next: (response) => {
          this.handleStartSuccess(response, course, 'activeUcatPracticeTest', '/dynamic/ucat/practice');
        },
        error: (error) => {
          this.handleStartError(error);
        }
      });
    }
  }

  onContinueTest(course: UcatCourseItem, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.startingTestId() !== null) {
      return;
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

    this.startingTestId.set(course.id);
    this.errorMessage.set(null);

    const isPreviousYear =
      course.rawItem?.source === 'previous_year' ||
      course.type === 'Previous Year Test';

    this.ucatService.getTestSession(sessionId).subscribe({
      next: (response) => {
        const rawRes = response as any;
        const sessionData = rawRes?.data || response;
        const sessionId =
          rawRes?.sessionId ||
          sessionData?.sessionId ||
          rawRes?.session_id ||
          sessionData?.session_id;

        const rawQuestions =
          sessionData?.questions ||
          (Array.isArray(sessionData) ? sessionData : null) ||
          (Array.isArray(rawRes?.data) ? rawRes.data : null) ||
          (Array.isArray(rawRes?.questions) ? rawRes.questions : []);
        const questions: UcatQuestion[] = Array.isArray(rawQuestions) ? rawQuestions : [];

        if (!sessionId || !questions.length) {
          this.errorMessage.set('Unable to restore session data.');
          this.startingTestId.set(null);
          return;
        }

        const durationMinutes =
          sessionData?.duration ||
          rawRes?.duration ||
          sessionData?.durationMinutes ||
          course.rawItem?.duration_minutes ||
          15;

        const activeSession: UcatActiveSession = {
          sessionId,
          durationMinutes,
          totalQuestions: questions.length,
          questions,
          questionStates: questions.map((q: any, idx: number) => {
            const qId = q.question_id ?? q.id ?? q._id ?? idx;
            const existingAns = (sessionData?.answers || rawRes?.answers)?.find(
              (a: any) => a.question_id === qId
            );
            return {
              questionId: qId,
              selectedOption: (existingAns?.selected_option as UcatOption) || null,
              timeSpent: existingAns?.time_spent || 0,
              visited: idx === 0
            };
          }),
          currentQuestionIndex: 0,
          startedAtTimestamp: Date.now(),
          test_type: sessionData?.test_type || rawRes?.test_type || course.type
        };

        try {
          sessionStorage.setItem(
            isPreviousYear ? 'activeUcatPreviousYearTest' : 'activeUcatPracticeTest',
            JSON.stringify(activeSession)
          );
        } catch {}

        this.startingTestId.set(null);
        void this.router.navigate([
          isPreviousYear ? '/dynamic/ucat/previous-year' : '/dynamic/ucat/practice'
        ]);
      },
      error: (error) => {
        this.handleStartError(error);
      }
    });
  }

  private handleStartSuccess(
    response: UcatStartTestResponse,
    course: UcatCourseItem,
    storageKey: string,
    targetRoute: string
  ): void {
    const rawRes = response as any;
    const sessionData = rawRes?.data || response;
    const sessionId =
      rawRes?.sessionId ||
      sessionData?.sessionId ||
      rawRes?.session_id ||
      sessionData?.session_id;

    const rawQuestions =
      sessionData?.questions ||
      (Array.isArray(sessionData) ? sessionData : null) ||
      (Array.isArray(rawRes?.data) ? rawRes.data : null) ||
      (Array.isArray(rawRes?.questions) ? rawRes.questions : []);
    const questions: UcatQuestion[] = Array.isArray(rawQuestions) ? rawQuestions : [];

    if (!sessionId || !questions.length) {
      this.errorMessage.set('The test could not be started with any questions.');
      this.startingTestId.set(null);
      return;
    }

    const durationMinutes =
      sessionData?.duration ||
      rawRes?.duration ||
      course.rawItem?.duration_minutes ||
      15;

    const activeSession: UcatActiveSession = {
      sessionId,
      durationMinutes,
      totalQuestions: questions.length,
      questions,
      questionStates: questions.map((q: any, idx: number) => ({
        questionId: q.question_id ?? q.id ?? q._id ?? idx,
        selectedOption: null,
        timeSpent: 0,
        visited: idx === 0
      })),
      currentQuestionIndex: 0,
      startedAtTimestamp: Date.now(),
      test_type: sessionData?.test_type || rawRes?.test_type || course.type
    };

    try {
      sessionStorage.setItem(storageKey, JSON.stringify(activeSession));
    } catch {}

    this.startingTestId.set(null);
    void this.router.navigate([targetRoute]);
  }

  private handleStartError(error: any): void {
    this.startingTestId.set(null);
    if (error?.status === 403) {
      this.errorMessage.set('You are not authorized to access this test session.');
    } else if (error?.status === 404) {
      this.errorMessage.set('Test session was not found.');
    } else {
      this.errorMessage.set(
        error?.error?.message ||
          error?.message ||
          'Unable to start test. Please try again.'
      );
    }
  }

  setTab(tab: 'all' | 'in_progress' | 'completed'): void {
    if (this.activeTab() === tab) return;
    this.activeTab.set(tab);
    this.loadReport(false);
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

  toggleFilterDropdown(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.filterDropdownOpen.set(!this.filterDropdownOpen());
  }

  isCategorySelected(category: string): boolean {
    return this.activeCategories().includes(category);
  }

  toggleCategory(category: string): void {
    const current = this.activeCategories();
    if (current.includes(category)) {
      this.activeCategories.set(current.filter((c) => c !== category));
    } else {
      this.activeCategories.set([...current, category]);
    }
    this.loadReport(false);
  }

  removeCategory(category: string): void {
    this.activeCategories.set(
      this.activeCategories().filter((c) => c !== category)
    );
    this.loadReport(false);
  }
}
