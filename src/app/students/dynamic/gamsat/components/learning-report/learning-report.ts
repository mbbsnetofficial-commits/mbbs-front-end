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
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { Icon } from '../../../../../shared/ui/icon/icon';
import { GamsatLearningReportService } from '../../services/gamsat-learning-report.service';
import { GamsatModalService } from '../../services/gamsat-modal.service';
import { GamsatService } from '../../services/gamsat.service';
import { GamsatPreviousYearService } from '../../services/gamsat-previous-year.service';
import {
  GamsatLearningReportItem,
  GamsatLearningReportPagination,
  GamsatLearningReportQueryParams,
  GamsatSummaryData
} from '../../models/gamsat-learning-report.model';
import { GamsatStartTestRequest } from '../../models/gamsat.model';
import {
  calculateGamsatProgress,
  countUniqueAnsweredQuestions
} from '../../utils/gamsat-progress.util';

export interface GamsatCourseItem {
  id: string;
  sessionId?: string;
  paperId?: string;
  testId?: string;
  testDefinitionId?: string;
  test_id: number;
  test_code: string;
  title: string;
  type: string;
  source: 'previous_year' | 'builtin' | 'custom' | string;
  stagesCount: string;
  level: string;
  status: string;
  rawStatus: 'not_started' | 'in_progress' | 'completed';
  stageInfo: string;
  progressPercent: number;
  progressColor: string;
  answeredQuestions: number;
  totalQuestions: number;
  progressDetail: string;
  formattedSubtitle: string;
  dateRange: string;
  dateModified: string;
  dateModifiedTimestamp: number;
  learningTime: string;
  score: string;
  scoreNum: number;
  category: string;
  iconBg: string;
  iconName: string;
  rawItem?: GamsatLearningReportItem;
}

@Component({
  selector: 'app-gamsat-learning-report',
  standalone: true,
  imports: [
    CommonModule,
    Icon,
    FormsModule
  ],
  templateUrl: './learning-report.html',
  styleUrl: './learning-report.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GamsatLearningReport implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('paginationSentinel') sentinelRef?: ElementRef<HTMLElement>;

  private readonly elementRef = inject(ElementRef);
  private readonly router = inject(Router);
  private readonly learningReportService = inject(GamsatLearningReportService);
  private readonly gamsatModalService = inject(GamsatModalService);
  private readonly gamsatService = inject(GamsatService);
  private readonly previousYearService = inject(GamsatPreviousYearService);
  private observer: IntersectionObserver | null = null;

  readonly searchQuery = signal('');
  readonly activeTab = signal<'all' | 'in_progress' | 'completed'>('all');
  readonly filterDropdownOpen = signal(false);
  readonly startingTestId = signal<string | number | null>(null);

  readonly summary = signal<GamsatSummaryData | null>(null);
  readonly isSummaryLoading = signal(false);
  readonly summaryError = signal<string | null>(null);

  readonly isLoading = signal(false);
  readonly isLoadingMore = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly totalPages = signal(1);
  readonly totalItems = signal(0);

  readonly sortField = signal<'date' | 'score' | 'time' | 'title' | 'progress'>('date');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  readonly availableCategories = signal<string[]>([
    'Section I: Reasoning in Humanities',
    'Section II: Written Communication',
    'Section III: Biological & Physical Sciences',
    'Custom Tests',
    'Previous Year Papers',
    'Builtin Practice Tests'
  ]);
  readonly activeCategories = signal<string[]>([]);

  readonly courses = signal<GamsatCourseItem[]>([]);

  // Computed KPI Card Formatters
  readonly formattedPracticeTime = computed(() => {
    if (this.isSummaryLoading()) return '...';
    const s = this.summary();
    if (!s) return '0 mins';
    if (s.totalPracticeTimeFormatted) return s.totalPracticeTimeFormatted;
    if (s.total_time_spent) return s.total_time_spent;
    const timeVal = s.totalPracticeTime ?? s.total_time_spent_seconds;
    if (timeVal !== undefined && timeVal !== null) {
      if (timeVal === 0) return '0 mins';
      if (timeVal >= 3600) {
        const h = Math.floor(timeVal / 3600);
        const m = Math.floor((timeVal % 3600) / 60);
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
      }
      if (timeVal >= 60) {
        return `${Math.round(timeVal / 60)} mins`;
      }
      return `${timeVal}s`;
    }
    return '0 mins';
  });

  readonly formattedAverageScore = computed(() => {
    if (this.isSummaryLoading()) return '...';
    const s = this.summary();
    if (!s) return '0';
    if (s.average_score !== undefined && s.average_score !== null) return s.average_score;
    if (s.averageRawScore !== undefined && s.averageRawScore !== null) return String(s.averageRawScore);
    if (s.averageScore !== undefined && s.averageScore !== null) return String(s.averageScore);
    if (s.average_score_number !== undefined && s.average_score_number !== null) return String(s.average_score_number);
    return '0';
  });

  readonly formattedCompletedTests = computed(() => {
    if (this.isSummaryLoading()) return '...';
    const s = this.summary();
    if (!s) return '0';
    if (s.completed_tests !== undefined && s.completed_tests !== null) return String(s.completed_tests);
    if (s.completedTests !== undefined && s.completedTests !== null) return String(s.completedTests);
    return '0';
  });

  readonly formattedStreak = computed(() => {
    if (this.isSummaryLoading()) return '...';
    const s = this.summary();
    if (!s) return '0 days';
    const streak = s.current_streak ?? s.currentStreak ?? 0;
    return `${streak} days`;
  });

  // Filtered and Sorted Courses
  readonly filteredCourses = computed(() => {
    let result = this.courses();

    const tab = this.activeTab();
    if (tab === 'in_progress') {
      result = result.filter((c) => c.rawStatus === 'in_progress');
    } else if (tab === 'completed') {
      result = result.filter((c) => c.rawStatus === 'completed');
    }

    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      result = result.filter((c) =>
        c.title.toLowerCase().includes(query) ||
        c.test_code.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query) ||
        c.type.toLowerCase().includes(query)
      );
    }

    const cats = this.activeCategories();
    if (cats.length > 0) {
      result = result.filter((c) => {
        const itemCategory = c.category.toLowerCase();
        const itemType = c.type.toLowerCase();
        const itemTitle = c.title.toLowerCase();

        return cats.some((cat) => {
          const selected = cat.toLowerCase();
          if (selected.includes('section i: reasoning') || selected === 'section i') {
            return itemCategory.includes('section_i') || itemCategory.includes('humanities') || itemTitle.includes('section i');
          }
          if (selected.includes('section ii: written communication') || selected === 'section ii') {
            return itemCategory.includes('section_ii') || itemCategory.includes('written') || itemTitle.includes('section ii');
          }
          if (selected.includes('section iii: biological') || selected === 'section iii') {
            return itemCategory.includes('section_iii') || itemCategory.includes('biological') || itemTitle.includes('section iii');
          }
          if (selected.includes('custom')) {
            return itemType.includes('custom') || c.rawItem?.source === 'custom';
          }
          if (selected.includes('previous') || selected.includes('past')) {
            return itemType.includes('previous_year') || c.rawItem?.source === 'previous_year';
          }
          if (selected.includes('builtin')) {
            return itemType.includes('builtin') || itemType.includes('built-in') || c.rawItem?.source === 'builtin';
          }
          return itemCategory.includes(selected) || itemType.includes(selected);
        });
      });
    }

    const field = this.sortField();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    return [...result].sort((a, b) => {
      if (field === 'date') {
        return (a.dateModifiedTimestamp - b.dateModifiedTimestamp) * dir;
      }
      if (field === 'score') {
        return (a.scoreNum - b.scoreNum) * dir;
      }
      if (field === 'title') {
        return a.title.localeCompare(b.title) * dir;
      }
      if (field === 'progress') {
        return (a.progressPercent - b.progressPercent) * dir;
      }
      return 0;
    });
  });

  constructor() {
    effect(() => {
      const savedTest = this.gamsatModalService.newlySavedTest();
      if (!savedTest) {
        return;
      }

      untracked(() => {
        this.loadReport(1);
        this.loadSummary();
        this.gamsatModalService.newlySavedTest.set(null);
      });
    });
  }

  ngOnInit(): void {
    this.loadSummary();
    this.loadFilters();
    this.loadReport(1);
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.filterDropdownOpen()) {
      return;
    }
    const target = event.target as HTMLElement | null;
    const insideDropdown = target && this.elementRef.nativeElement.querySelector('.filter-dropdown-wrap')?.contains(target);
    if (!insideDropdown) {
      this.filterDropdownOpen.set(false);
    }
  }

  loadSummary(): void {
    this.isSummaryLoading.set(true);
    this.summaryError.set(null);

    this.learningReportService.getSummary().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.summary.set(res.data);
        }
        this.isSummaryLoading.set(false);
      },
      error: (err) => {
        this.summaryError.set(this.getErrorMessage(err, 'Unable to load GAMSAT summary.'));
        this.isSummaryLoading.set(false);
      }
    });
  }

  loadFilters(): void {
    this.learningReportService.getFilters().subscribe({
      next: (res) => {
        if (res?.data?.sections && Array.isArray(res.data.sections)) {
          const sectionLabels = res.data.sections.map((s) => {
            if (s === 'SECTION_I') return 'Section I: Reasoning in Humanities';
            if (s === 'SECTION_II') return 'Section II: Written Communication';
            if (s === 'SECTION_III') return 'Section III: Biological & Physical Sciences';
            return s;
          });
          this.availableCategories.set([
            ...sectionLabels,
            'Custom Tests',
            'Previous Year Papers',
            'Builtin Practice Tests'
          ]);
        }
      },
      error: () => {
        // Fallback default categories remain intact
      }
    });
  }

  loadReport(page = 1, append = false): void {
    if (page === 1) {
      this.isLoading.set(true);
    } else {
      this.isLoadingMore.set(true);
    }
    this.errorMessage.set(null);

    const queryParams: GamsatLearningReportQueryParams = {
      status: this.activeTab(),
      page,
      limit: this.pageSize(),
      sortBy: this.sortField(),
      sortOrder: this.sortDirection()
    };

    const report$ = this.learningReportService.getLearningReport(queryParams).pipe(
      catchError(() => of({ success: true, data: { kpi: null, tests: [] } }))
    );
    const papers$ = this.previousYearService.getPapers().pipe(
      catchError(() => of({ success: true, data: [] }))
    );
    const builtin$ = this.gamsatService.getBuiltinTests().pipe(
      catchError(() => of({ success: true, data: [] }))
    );

    forkJoin({ report: report$, papers: papers$, builtin: builtin$ }).subscribe({
      next: ({ report: res, papers: papersRes, builtin: builtinRes }) => {
        let rawItems: GamsatLearningReportItem[] = [];
        let pagination: GamsatLearningReportPagination | undefined = (res as any)?.pagination;

        if (res) {
          if (Array.isArray(res.data)) {
            rawItems = res.data;
          } else if (res.data && typeof res.data === 'object') {
            const d = res.data as any;
            if (Array.isArray(d.tests)) {
              rawItems = d.tests;
            } else if (Array.isArray(d.items)) {
              rawItems = d.items;
            } else if (Array.isArray(d.attempts)) {
              rawItems = d.attempts;
            } else if (Array.isArray(d.records)) {
              rawItems = d.records;
            }
            if (d.pagination) {
              pagination = d.pagination;
            }
            if (d.kpi) {
              this.summary.set({
                totalPracticeTime: d.kpi.totalPracticeTime,
                totalPracticeTimeFormatted: d.kpi.totalPracticeTimeFormatted,
                averageRawScore: typeof d.kpi.averageScore === 'number' ? d.kpi.averageScore : undefined,
                averageScore: d.kpi.averageScore,
                completedTests: d.kpi.completedTests,
                currentStreak: d.kpi.currentStreak,
                averageAccuracy: d.kpi.averageAccuracy
              });
            }
          } else if (Array.isArray((res as any).tests)) {
            rawItems = (res as any).tests;
          }
        }

        // Build catalogue maps for Previous Year papers and Built-in tests
        const pyqPapers = Array.isArray(papersRes?.data) ? papersRes.data : [];
        const cataloguePapersByMasterKey = new Map<string, any>();
        for (const p of pyqPapers) {
          const mKey = this.getMasterTestKey(p, 'previous_year');
          if (!cataloguePapersByMasterKey.has(mKey)) {
            cataloguePapersByMasterKey.set(mKey, p);
          }
        }

        const builtinTests = Array.isArray(builtinRes?.data) ? builtinRes.data : [];
        const catalogueBuiltinByMasterKey = new Map<string, any>();
        for (const b of builtinTests) {
          const mKey = this.getMasterTestKey(b, 'builtin');
          if (!catalogueBuiltinByMasterKey.has(mKey)) {
            catalogueBuiltinByMasterKey.set(mKey, b);
          }
        }

        let storedCustomConfigs: any[] = [];
        try {
          const storedRaw = localStorage.getItem('gamsat_saved_custom_tests');
          if (storedRaw) {
            storedCustomConfigs = JSON.parse(storedRaw);
          }
        } catch {
          storedCustomConfigs = [];
        }

        const catalogueCustomByMasterKey = new Map<string, any>();
        for (const cfg of storedCustomConfigs) {
          const mKey = this.getMasterTestKey(cfg, 'custom');
          if (!catalogueCustomByMasterKey.has(mKey)) {
            catalogueCustomByMasterKey.set(mKey, cfg);
          }
        }

        // Step 1: Map all raw attempts
        const mappedAttempts = rawItems.map((item) => this.mapReportItemToCourse(item));

        // Step 2: Group attempts by stable master test definition key
        const attemptsByMasterKey = new Map<string, GamsatCourseItem[]>();
        for (const att of mappedAttempts) {
          const key = this.getMasterTestKey(att.rawItem || att, att.source);
          if (!attemptsByMasterKey.has(key)) {
            attemptsByMasterKey.set(key, []);
          }
          attemptsByMasterKey.get(key)!.push(att);
        }

        // Step 3: Pick the single representative attempt per master test definition
        // Priority: IN_PROGRESS (latest) > COMPLETED (latest) > other (latest)
        const representativeAttempts: GamsatCourseItem[] = [];
        for (const [key, group] of attemptsByMasterKey.entries()) {
          group.sort((a, b) => {
            const statusPriority = (s: string) => {
              if (s === 'in_progress') return 1;
              if (s === 'completed') return 2;
              return 3;
            };
            const prioA = statusPriority(a.rawStatus);
            const prioB = statusPriority(b.rawStatus);
            if (prioA !== prioB) {
              return prioA - prioB;
            }
            return (b.dateModifiedTimestamp || 0) - (a.dateModifiedTimestamp || 0);
          });

          const best = { ...group[0] };
          // Ensure the row has the master test key as its stable, unique identity
          best.id = key;

          // If this is a Previous Year test, ensure paperId is enriched from catalogue
          if (best.source === 'previous_year' || best.type === 'PREVIOUS YEAR') {
            const catPaper = cataloguePapersByMasterKey.get(key);
            if (catPaper) {
              best.paperId = String(catPaper.paperId || catPaper.id || best.paperId);
              best.testDefinitionId = best.paperId;
              if (!best.title || best.title === 'GAMSAT Practice Test') {
                best.title = (catPaper.title || catPaper.name || 'GAMSAT Past Paper').replace(/_/g, ' ');
              }
            }
            try {
              const pyqRaw = sessionStorage.getItem('activeGamsatSession');
              if (pyqRaw) {
                const pyqData = JSON.parse(pyqRaw);
                const matchesPyq = pyqData && (
                  pyqData.sessionId === best.sessionId ||
                  pyqData.sessionId === best.id ||
                  pyqData.paperId === best.paperId
                );
                if (matchesPyq && Array.isArray(pyqData.questionStates) && best.rawStatus === 'in_progress') {
                  const answeredLocal = countUniqueAnsweredQuestions(pyqData.questionStates);
                  const totalLocal = pyqData.totalQuestions || pyqData.questions?.length || best.totalQuestions;
                  best.answeredQuestions = answeredLocal;
                  best.totalQuestions = totalLocal;
                  best.progressPercent = calculateGamsatProgress(answeredLocal, totalLocal);
                  best.progressDetail = `${answeredLocal} / ${totalLocal} Questions`;
                }
              }
            } catch {}
          }

          // If this is a Built-in test, ensure testId and category are enriched from catalogue
          if (best.source === 'builtin' || best.type === 'BUILT-IN') {
            const catBuiltin = catalogueBuiltinByMasterKey.get(key);
            if (catBuiltin) {
              best.testId = String(catBuiltin.id || best.testId);
              best.testDefinitionId = best.testId;
              if (!best.title || best.title === 'GAMSAT Practice Test') {
                best.title = (catBuiltin.title || catBuiltin.name || 'GAMSAT Built-in Test').replace(/_/g, ' ');
              }
              if (Array.isArray(catBuiltin.sections)) {
                best.category = catBuiltin.sections.join(', ');
              }
            }
          }

          // If this is a Custom test, enrich from registered custom configurations or active session
          if (best.source === 'custom' || best.type === 'CUSTOM TEST') {
            const catCustom = catalogueCustomByMasterKey.get(key);
            if (catCustom) {
              if (!best.title || best.title === 'GAMSAT Practice Test') {
                best.title = catCustom.title || 'GAMSAT Custom Practice Test';
              }
              const secList = Array.isArray(catCustom.sections) && catCustom.sections.length > 0
                ? catCustom.sections.map((s: string) => this.formatSectionName(s)).join(', ')
                : best.category;
              best.category = secList;
              const qCount = catCustom.questionCount || best.totalQuestions || 40;
              const duration = catCustom.duration || 79;
              best.totalQuestions = qCount;
              best.stagesCount = `${qCount} Questions`;
              best.stageInfo = `${qCount} Questions · ${duration}m`;
              best.test_code = `GM-TEST-${this.normalizeKey(catCustom.title || 'CUSTOM').toUpperCase()}`;
              best.level = catCustom.difficulty || catCustom.level || best.level;
            }

            // Also check real-time session storage for active practice session
            try {
              const practiceRaw = sessionStorage.getItem('activeGamsatPracticeSession');
              if (practiceRaw) {
                const practiceData = JSON.parse(practiceRaw);
                const matchesPractice = practiceData && (
                  practiceData.sessionId === best.sessionId ||
                  practiceData.sessionId === best.id ||
                  practiceData.sessionId === (best.rawItem as any)?.sessionId
                );
                if (matchesPractice) {
                  if (practiceData.testName && (!best.title || best.title === 'GAMSAT Practice Test')) {
                    best.title = practiceData.testName;
                  }
                  if (Array.isArray(practiceData.questionStates)) {
                    const answeredLocal = countUniqueAnsweredQuestions(practiceData.questionStates);
                    const totalLocal = practiceData.totalQuestions || practiceData.questions?.length || best.totalQuestions;
                    if (best.rawStatus === 'in_progress') {
                      best.answeredQuestions = answeredLocal;
                      best.totalQuestions = totalLocal;
                      best.progressPercent = calculateGamsatProgress(answeredLocal, totalLocal);
                      best.progressDetail = `${answeredLocal} / ${totalLocal} Questions`;
                    }
                  }
                }
              }
            } catch {}
          }

          // Format clean, professional subtitle
          if (best.test_code && !best.test_code.startsWith('GM-TEST') && best.test_code !== 'GM-') {
            best.formattedSubtitle = `${best.test_code} · ${best.stageInfo}`;
          } else {
            const displayCat = best.category && best.category !== 'GAMSAT Practice' && best.category !== 'CUSTOM TEST' && best.category !== 'Hard'
              ? best.category
              : 'Custom Practice Drill';
            best.formattedSubtitle = `${displayCat} · ${best.stageInfo}`;
          }

          if (best.rawStatus === 'completed') {
            best.progressPercent = 100;
            best.progressDetail = `${best.totalQuestions} / ${best.totalQuestions} Questions`;
          } else {
            best.progressDetail = `${best.answeredQuestions} / ${best.totalQuestions} Questions`;
          }

          representativeAttempts.push(best);
        }

        // Step 4: Unattempted Previous Year Papers (Available Tests)
        const unattemptedPaperItems: GamsatCourseItem[] = [];
        const seenCataloguePaperKeys = new Set<string>();

        for (const p of pyqPapers) {
          const pTitle = (p.title || p.name?.replace(/_/g, ' ') || 'GAMSAT Past Paper').replace(/_/g, ' ');
          const masterKey = this.getMasterTestKey(p, 'previous_year');

          if (seenCataloguePaperKeys.has(masterKey) || attemptsByMasterKey.has(masterKey)) {
            continue;
          }
          seenCataloguePaperKeys.add(masterKey);

          const paperId = String(p.paperId || p.id);
          const numericId = String(p.numericId || '');
          const year = this.extractYearFromTitle(pTitle) || this.extractYearFromTitle(paperId);
          const qCount = p.questionCount || 137;
          const duration = p.durationMinutes || 270;
          const stageInfo = `${qCount} Questions · ${duration}m`;
          const testCode = `GM-PYQ-${year || numericId || 'TEST'}`;

          unattemptedPaperItems.push({
            id: masterKey,
            paperId: paperId,
            testDefinitionId: paperId,
            test_id: p.numericId || 0,
            test_code: testCode,
            title: pTitle,
            type: 'PREVIOUS YEAR',
            source: 'previous_year',
            stagesCount: `${qCount} Questions`,
            level: 'Advanced',
            status: 'Not Started',
            rawStatus: 'not_started',
            stageInfo,
            progressPercent: 0,
            progressColor: '#e2e8f0',
            answeredQuestions: 0,
            totalQuestions: qCount,
            progressDetail: `0 / ${qCount} Questions`,
            formattedSubtitle: `${testCode} · ${stageInfo}`,
            dateRange: 'Available',
            dateModified: 'Available',
            dateModifiedTimestamp: 0,
            learningTime: '0m',
            score: '—',
            scoreNum: 0,
            category: 'Previous Year Paper',
            iconBg: '#f05a28',
            iconName: 'bookmark',
            rawItem: {
              id: paperId,
              paperId: paperId,
              testName: pTitle,
              source: 'previous_year',
              type: 'PREVIOUS_YEAR',
              status: 'not_started',
              durationMinutes: duration,
              totalQuestions: qCount
            } as any
          });
        }

        // Step 5: Unattempted Built-in Tests (Available Tests)
        const unattemptedBuiltinItems: GamsatCourseItem[] = [];
        const seenCatalogueBuiltinKeys = new Set<string>();

        for (const b of builtinTests) {
          const bId = String(b.id || b.test_id || b.builtin_test_id);
          const bTitle = (b.title || b.name || 'GAMSAT Built-in Test').replace(/_/g, ' ');
          const masterKey = this.getMasterTestKey(b, 'builtin');

          if (seenCatalogueBuiltinKeys.has(masterKey) || attemptsByMasterKey.has(masterKey)) {
            continue;
          }
          seenCatalogueBuiltinKeys.add(masterKey);

          const qCount = b.total_questions || 0;
          const duration = b.duration_minutes || 0;
          const stageInfo = `${qCount} Questions · ${duration}m`;
          const testCode = `GM-${bId.toUpperCase().replace(/[-_]+/g, '_')}`;
          const bCategory = Array.isArray(b.sections) ? b.sections.join(', ') : 'Built-in Practice Test';

          unattemptedBuiltinItems.push({
            id: masterKey,
            testId: bId,
            testDefinitionId: bId,
            test_id: 0,
            test_code: testCode,
            title: bTitle,
            type: 'BUILT-IN',
            source: 'builtin',
            stagesCount: `${qCount} Questions`,
            level: b.difficulty || 'Intermediate',
            status: 'Not Started',
            rawStatus: 'not_started',
            stageInfo,
            progressPercent: 0,
            progressColor: '#e2e8f0',
            answeredQuestions: 0,
            totalQuestions: qCount,
            progressDetail: `0 / ${qCount} Questions`,
            formattedSubtitle: `${bCategory} · ${stageInfo}`,
            dateRange: 'Available',
            dateModified: 'Available',
            dateModifiedTimestamp: 0,
            learningTime: '0m',
            score: '—',
            scoreNum: 0,
            category: bCategory,
            iconBg: '#3b82f6',
            iconName: 'test',
            rawItem: {
              id: bId,
              testId: bId,
              testName: bTitle,
              source: 'builtin',
              type: b.test_type || 'BUILTIN',
              status: 'not_started',
              durationMinutes: duration,
              totalQuestions: qCount,
              sections: b.sections
            } as any
          });
        }

        // Step 5b: Unattempted Custom Tests (from client custom tests registry)
        const unattemptedCustomItems: GamsatCourseItem[] = [];
        const seenCustomKeys = new Set<string>();

        for (const cfg of storedCustomConfigs) {
          const masterKey = this.getMasterTestKey(cfg, 'custom');
          if (seenCustomKeys.has(masterKey) || attemptsByMasterKey.has(masterKey)) {
            continue;
          }
          seenCustomKeys.add(masterKey);

          const qCount = cfg.questionCount || 40;
          const duration = cfg.duration || 79;
          const secList = Array.isArray(cfg.sections) && cfg.sections.length > 0
            ? cfg.sections.map((s: string) => this.formatSectionName(s)).join(', ')
            : 'Custom Practice Drill';
          const stageInfo = `${qCount} Questions · ${duration}m`;
          const testCode = `GM-TEST-${this.normalizeKey(cfg.title || 'CUSTOM').toUpperCase()}`;

          unattemptedCustomItems.push({
            id: masterKey,
            testId: masterKey,
            testDefinitionId: masterKey,
            test_id: 0,
            test_code: testCode,
            title: cfg.title || 'GAMSAT Custom Practice Test',
            type: 'CUSTOM TEST',
            source: 'custom',
            stagesCount: `${qCount} Questions`,
            level: cfg.difficulty || cfg.level || 'Hard',
            status: 'Not Started',
            rawStatus: 'not_started',
            stageInfo,
            progressPercent: 0,
            progressColor: '#e2e8f0',
            answeredQuestions: 0,
            totalQuestions: qCount,
            progressDetail: `0 / ${qCount} Questions`,
            formattedSubtitle: `${secList} · ${stageInfo}`,
            dateRange: 'Available',
            dateModified: 'Available',
            dateModifiedTimestamp: 0,
            learningTime: '0m',
            score: '—',
            scoreNum: 0,
            category: secList,
            iconBg: '#f59e0b',
            iconName: 'sparkles',
            rawItem: {
              title: cfg.title,
              testName: cfg.title,
              source: 'custom',
              type: 'CUSTOM',
              status: 'not_started',
              durationMinutes: duration,
              totalQuestions: qCount,
              sections: cfg.sections,
              topic_ids: cfg.topic_ids,
              difficulty: cfg.difficulty,
              level: cfg.level
            } as any
          });
        }

        // Step 6: Exactly ONE row per unique master test definition across all categories
        const unifiedList = [...representativeAttempts, ...unattemptedPaperItems, ...unattemptedBuiltinItems, ...unattemptedCustomItems];

        if (append) {
          this.courses.update((existing) => {
            const existingIds = new Set(existing.map((e) => e.id));
            const newItems = unifiedList.filter((u) => !existingIds.has(u.id));
            return [...existing, ...newItems];
          });
        } else {
          this.courses.set(unifiedList);
        }

        if (pagination) {
          this.currentPage.set(pagination.page);
          this.totalPages.set(pagination.totalPages);
          this.totalItems.set(unifiedList.length);
        } else {
          this.currentPage.set(page);
          this.totalPages.set(1);
          this.totalItems.set(unifiedList.length);
        }

        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
      error: (err) => {
        this.errorMessage.set(this.getErrorMessage(err, 'Unable to load GAMSAT tests.'));
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      }
    });
  }

  private getMasterTestKey(item: GamsatLearningReportItem | any, defaultSource?: string): string {
    const rawTitle = (
      item.testName ||
      item.test_name ||
      item.paper_name ||
      item.paperTitle ||
      item.title ||
      item.name ||
      item.course_name?.title ||
      ''
    ).toLowerCase().replace(/_/g, ' ').trim();

    const rawType = (item.type || item.test_type || item.source || defaultSource || '').toString().toUpperCase();

    // 1. PREVIOUS YEAR PAPER
    const isPyq =
      rawType.includes('PREVIOUS') ||
      rawType.includes('PYQ') ||
      rawTitle.includes('201') ||
      rawTitle.includes('202') ||
      rawTitle.includes('style') ||
      defaultSource === 'previous_year';

    if (isPyq) {
      const year = this.extractYearFromTitle(rawTitle) || this.extractYearFromTitle(item.test_code || item.testCode || '');
      if (year) {
        return `pyq_${year}`;
      }
      const paperId = item.paperId || item.paper_id || item.previous_year_paper_id;
      if (paperId && !String(paperId).startsWith('GAMSAT-')) {
        return `pyq_${this.normalizeKey(paperId)}`;
      }
      return `pyq_${this.normalizeKey(rawTitle || 'paper')}`;
    }

    // 2. BUILT-IN TEST
    const rawBuiltinId = item.builtin_test_id || item.testId || item.test_id;
    const isBuiltin =
      rawType.includes('BUILTIN') ||
      rawType === 'FULL_TEST' ||
      defaultSource === 'builtin' ||
      item.source === 'builtin' ||
      (typeof item.id === 'string' && item.id.startsWith('gamsat-')) ||
      (typeof rawBuiltinId === 'string' && rawBuiltinId.startsWith('gamsat-')) ||
      rawTitle.includes('full mock') ||
      rawTitle.includes('mock exam') ||
      rawTitle.includes('practice test:');

    if (isBuiltin) {
      const testId = (typeof item.id === 'string' && item.id.startsWith('gamsat-'))
        ? item.id
        : (rawBuiltinId && !String(rawBuiltinId).startsWith('GAMSAT-') ? String(rawBuiltinId) : null);

      if (testId) {
        return `builtin_${this.normalizeKey(testId)}`;
      }
      // Match stable built-in titles if ID is not direct
      if (rawTitle.includes('full mock') || rawTitle.includes('comprehensive')) return 'builtin_gamsatmock1';
      if (rawTitle.includes('section i:') || rawTitle.includes('written communication')) return 'builtin_gamsatsection1mock';
      if (rawTitle.includes('section ii:') || rawTitle.includes('humanities')) return 'builtin_gamsatsection2mock';
      if (rawTitle.includes('section iii:') || rawTitle.includes('biological')) return 'builtin_gamsatsection3mock';
      return `builtin_${this.normalizeKey(rawTitle || 'mock')}`;
    }

    // 3. CUSTOM TEST / DRILL
    const customTestId = item.custom_test_id || item.customTestId;
    if (customTestId && !String(customTestId).startsWith('GAMSAT-')) {
      return `custom_${this.normalizeKey(customTestId)}`;
    }
    const testCode = item.test_code || item.testCode;
    if (testCode && !String(testCode).startsWith('GAMSAT-') && !String(testCode).startsWith('GM-TEST')) {
      return `custom_${this.normalizeKey(testCode)}`;
    }
    const sections = Array.isArray(item.sections) && item.sections.length > 0
      ? item.sections.map((s: string) => String(s).toUpperCase()).sort().join('_')
      : (typeof item.section === 'string' && item.section ? item.section.toUpperCase() : '');

    if (sections) {
      return `custom_${this.normalizeKey(sections)}`;
    }
    return `custom_${this.normalizeKey(rawTitle || 'custom_drill')}`;
  }

  private normalizeKey(str: string | number | undefined | null): string {
    if (!str) return '';
    return String(str).toLowerCase().trim().replace(/[\s\-_]+/g, '');
  }

  private extractYearFromTitle(str: string): string | null {
    if (!str) return null;
    const match = str.match(/20\d{2}/);
    return match ? match[0] : null;
  }

  private calculateProgressPercent(item: GamsatLearningReportItem, rawStatus: 'not_started' | 'in_progress' | 'completed'): number {
    if (rawStatus === 'completed') {
      return 100;
    }
    if (rawStatus === 'not_started') {
      return 0;
    }

    const totalQ = item.totalQuestions || item.total_questions || (item as any).questionCount || (item as any).question_count || (item as any).total || 0;

    // 1. If answers array exists, answers are the primary authoritative source of truth (handles [] cleanly as 0 answers -> 0%)
    if (Array.isArray((item as any).answers)) {
      const answeredCount = countUniqueAnsweredQuestions((item as any).answers);
      if (totalQ > 0) {
        return calculateGamsatProgress(answeredCount, totalQ);
      }
      return 0;
    }

    // 2. If answered count field is present from backend response
    const answeredQ =
      (item as any).answeredQuestions ??
      (item as any).answered_questions ??
      (item as any).answeredCount ??
      (item as any).answered_count ??
      (item as any).attempted ??
      (item as any).answered;

    if (typeof answeredQ === 'number') {
      if (totalQ > 0) {
        return calculateGamsatProgress(answeredQ, totalQ);
      }
      return 0;
    }

    // 3. Real-time sync with active session storage for matching sessionId
    try {
      const targetSessionId = item.sessionId || (item as any).session_id || (item as any).id;
      if (targetSessionId) {
        const pyqSaved = sessionStorage.getItem('activeGamsatSession');
        const practiceSaved = sessionStorage.getItem('activeGamsatPracticeSession');
        for (const raw of [pyqSaved, practiceSaved]) {
          if (raw) {
            const data = JSON.parse(raw);
            if (data?.sessionId === targetSessionId && Array.isArray(data.questionStates)) {
              const localAnswered = countUniqueAnsweredQuestions(data.questionStates);
              const localTotal = data.totalQuestions || data.questions?.length || totalQ;
              if (localTotal > 0) {
                return calculateGamsatProgress(localAnswered, localTotal);
              }
            }
          }
        }
      }
    } catch {}

    // 4. If explicit numeric progress is provided from backend
    if (typeof item.progress === 'number' && !isNaN(item.progress)) {
      const timeSpentNum = typeof item.timeSpent === 'number' ? item.timeSpent : (typeof (item as any).time_spent_seconds === 'number' ? (item as any).time_spent_seconds : -1);
      const timeSpentStr = String(item.timeSpentFormatted || item.time_spent || '').trim();
      const isZeroTime = timeSpentNum === 0 || timeSpentStr === '0m 0s' || timeSpentStr === '0m' || timeSpentStr === '0s';

      // If test spent 0s and has no recorded answers, prevent stale backend placeholder 50% from showing
      if (isZeroTime && item.progress === 50) {
        return 0;
      }
      return Math.max(0, Math.min(100, Math.round(item.progress)));
    }

    return 0;
  }

  private calculateAnsweredCount(
    item: GamsatLearningReportItem,
    totalQ: number,
    progressPercent: number,
    rawStatus: 'not_started' | 'in_progress' | 'completed'
  ): number {
    if (rawStatus === 'completed') {
      return totalQ;
    }
    if (rawStatus === 'not_started') {
      return 0;
    }

    // 1. If answers array exists
    if (Array.isArray((item as any).answers)) {
      return countUniqueAnsweredQuestions((item as any).answers);
    }

    // 2. If answered count field is present from backend response
    const answeredQ =
      (item as any).answeredQuestions ??
      (item as any).answered_questions ??
      (item as any).answeredCount ??
      (item as any).answered_count ??
      (item as any).attempted ??
      (item as any).answered;

    if (typeof answeredQ === 'number') {
      return Math.max(0, Math.min(totalQ, answeredQ));
    }

    // 3. Real-time sync with active session storage
    try {
      const targetSessionId = item.sessionId || (item as any).session_id || (item as any).id;
      if (targetSessionId) {
        const pyqSaved = sessionStorage.getItem('activeGamsatSession');
        const practiceSaved = sessionStorage.getItem('activeGamsatPracticeSession');
        for (const raw of [pyqSaved, practiceSaved]) {
          if (raw) {
            const data = JSON.parse(raw);
            if (data?.sessionId === targetSessionId && Array.isArray(data.questionStates)) {
              return countUniqueAnsweredQuestions(data.questionStates);
            }
          }
        }
      }
    } catch {}

    // 4. Derive from progress percentage
    if (progressPercent > 0 && totalQ > 0) {
      return Math.max(0, Math.min(totalQ, Math.round((progressPercent / 100) * totalQ)));
    }

    return 0;
  }

  private mapReportItemToCourse(item: GamsatLearningReportItem): GamsatCourseItem {
    const rawStatusStr = (item.status || 'not_started').toLowerCase().replace('-', '_');
    let rawStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started';

    if (rawStatusStr.includes('complete') || rawStatusStr.includes('submit')) {
      rawStatus = 'completed';
    } else if (rawStatusStr.includes('progress') || rawStatusStr.includes('active') || rawStatusStr.includes('resume')) {
      rawStatus = 'in_progress';
    } else {
      rawStatus = 'not_started';
    }

    let progressPercent = this.calculateProgressPercent(item, rawStatus);

    if (rawStatus === 'not_started' && progressPercent > 0 && progressPercent < 100) {
      rawStatus = 'in_progress';
    }

    let statusLabel = 'Not Started';
    let progressColor = '#e2e8f0';

    if (rawStatus === 'completed') {
      statusLabel = 'Completed';
      progressColor = '#10b981';
      progressPercent = 100;
    } else if (rawStatus === 'in_progress') {
      statusLabel = 'In Progress';
      progressColor = '#f05a28';
    }

    const rawTitle =
      item.testName ||
      item.test_name ||
      (item as any).paper_name ||
      (item as any).paperTitle ||
      (item as any).title ||
      (item as any).name ||
      item.course_name?.title ||
      `GAMSAT Practice Test`;

    // Clean up title formatting
    const title = rawTitle.replace(/_/g, ' ');

    let typeStr = 'CUSTOM TEST';
    let iconBg = '#f59e0b';
    let iconName = 'sparkles';
    let source: 'previous_year' | 'builtin' | 'custom' = 'custom';

    if (item.source === 'previous_year' || item.type === 'PREVIOUS_YEAR' || item.type === 'PREVIOUS YEAR' || title.toLowerCase().includes('gamsat 20') || title.toLowerCase().includes('style')) {
      typeStr = 'PREVIOUS YEAR';
      iconBg = '#f05a28';
      iconName = 'bookmark';
      source = 'previous_year';
    } else if (item.source === 'builtin' || item.type === 'FULL_TEST' || item.type === 'SECTIONAL_TEST' || item.type === 'BUILTIN') {
      typeStr = 'BUILT-IN';
      iconBg = '#3b82f6';
      iconName = 'test';
      source = 'builtin';
    }

    const sessionId = String(item.sessionId || item.session_id || (String(item.id || '').startsWith('GAMSAT') ? item.id : ''));
    const paperId = item.paperId || item.paper_id || item.previous_year_paper_id;
    const testId = item.testId || item.test_id || item.custom_test_id;
    const testDefId = paperId || testId || (item as any).numericId || '';

    // Generate clean test definition code (e.g. GM-PYQ-2019, GM-BLT-PHYSICS)
    let testCode = item.testCode || item.test_code || '';
    if (!testCode || testCode.startsWith('GAMSAT-PYQ-') || testCode.startsWith('GAMSAT-BLT-') || testCode.startsWith('GAMSAT-1')) {
      const year = this.extractYearFromTitle(title);
      if (source === 'previous_year' || title.toLowerCase().includes('2019') || title.toLowerCase().includes('2020') || title.toLowerCase().includes('style')) {
        testCode = `GM-PYQ-${year || '2019'}`;
      } else if (source === 'builtin') {
        testCode = `GM-${String(testDefId || 'BLT').toUpperCase().replace(/-/g, '_')}`;
      } else {
        testCode = `GM-${String(testDefId || 'TEST').toUpperCase().replace(/-/g, '_')}`;
      }
    }

    const idStr = String(item.sessionId || item.session_id || item.id || Math.random());
    const category = item.sections?.join(', ') || item.difficulty || item.level || item.type || (source === 'previous_year' ? 'Previous Year Paper' : 'GAMSAT Practice');

    let scoreDisplay = '—';
    let scoreNum = 0;
    if (typeof item.score === 'string') {
      scoreDisplay = item.score;
      const numMatch = item.score.match(/\d+/);
      scoreNum = numMatch ? parseInt(numMatch[0], 10) : 0;
    } else if (typeof item.score === 'number') {
      scoreDisplay = String(item.score);
      scoreNum = item.score;
    } else if (item.score && typeof item.score === 'object') {
      scoreDisplay = item.score.formatted || `${item.score.earned ?? 0}/${item.score.total_marks ?? 0}`;
      scoreNum = item.score.earned || 0;
    } else if (item.rawScore !== undefined && item.rawScore !== null) {
      scoreDisplay = String(item.rawScore);
      scoreNum = item.rawScore;
    }

    const rawDate =
      item.dateModified ||
      item.date_modified ||
      item.lastModifiedAt ||
      item.completedAt ||
      item.completed_at ||
      item.submittedAt ||
      item.submitted_at ||
      item.createdAt ||
      item.created_at ||
      '';
    let dateDisplay = 'Available';
    let dateModifiedTimestamp = 0;

    if (rawDate) {
      const parsed = Date.parse(rawDate);
      if (!isNaN(parsed)) {
        dateModifiedTimestamp = parsed;
        const d = new Date(parsed);
        dateDisplay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } else {
        dateDisplay = rawDate;
      }
    }

    const qCount = item.total_questions || item.totalQuestions || 0;
    const duration = item.duration_minutes || item.durationMinutes || (typeof item.timeSpent === 'number' ? Math.round(item.timeSpent / 60) : 0);
    const effectiveTotalQ = qCount > 0 ? qCount : (source === 'previous_year' ? 137 : 40);
    const effectiveDuration = duration > 0 ? duration : (source === 'previous_year' ? 270 : 79);
    const stageInfo = `${effectiveTotalQ} Questions · ${effectiveDuration}m`;

    const answeredCount = this.calculateAnsweredCount(item, effectiveTotalQ, progressPercent, rawStatus);

    let progressDetail = '';
    if (rawStatus === 'completed') {
      progressDetail = `${effectiveTotalQ} / ${effectiveTotalQ} Questions`;
    } else {
      progressDetail = `${answeredCount} / ${effectiveTotalQ} Questions`;
    }

    let formattedSubtitle = '';
    if (testCode && !testCode.startsWith('GM-TEST') && testCode !== 'GM-') {
      formattedSubtitle = `${testCode} · ${stageInfo}`;
    } else {
      const displayCategory = category && category !== 'GAMSAT Practice' && category !== 'CUSTOM TEST' && category !== 'Hard'
        ? category
        : 'Custom Practice Drill';
      formattedSubtitle = `${displayCategory} · ${stageInfo}`;
    }

    let learningTime = '0m';
    if (item.timeSpentFormatted) {
      learningTime = item.timeSpentFormatted;
    } else if (item.time_spent) {
      learningTime = item.time_spent;
    } else if (typeof item.timeSpent === 'number' && item.timeSpent > 0) {
      const min = Math.floor(item.timeSpent / 60);
      const sec = item.timeSpent % 60;
      learningTime = min > 0 ? `${min}m ${sec}s` : `${sec}s`;
    }

    const numericTestId = typeof item.test_id === 'number' ? item.test_id : (typeof item.testId === 'number' ? item.testId : (typeof item.id === 'number' ? item.id : 0));

    return {
      id: idStr,
      sessionId: sessionId || undefined,
      paperId: paperId ? String(paperId) : undefined,
      testId: testId ? String(testId) : undefined,
      testDefinitionId: paperId ? String(paperId) : (testId ? String(testId) : undefined),
      test_id: numericTestId,
      test_code: testCode,
      title,
      type: typeStr,
      source,
      stagesCount: `${effectiveTotalQ} Questions`,
      level: item.level || item.difficulty || 'Intermediate',
      status: statusLabel,
      rawStatus,
      stageInfo,
      progressPercent,
      progressColor,
      answeredQuestions: answeredCount,
      totalQuestions: effectiveTotalQ,
      progressDetail,
      formattedSubtitle,
      dateRange: dateDisplay,
      dateModified: dateDisplay,
      dateModifiedTimestamp,
      learningTime,
      score: scoreDisplay,
      scoreNum,
      category,
      iconBg,
      iconName,
      rawItem: item
    };
  }

  setTab(tab: 'all' | 'in_progress' | 'completed'): void {
    if (this.activeTab() === tab) {
      return;
    }
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.loadReport(1);
  }

  toggleSort(field: 'date' | 'score' | 'time' | 'title' | 'progress'): void {
    if (this.sortField() === field) {
      this.sortDirection.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortField.set(field);
      this.sortDirection.set('desc');
    }
    this.loadReport(1);
  }

  toggleFilterDropdown(event: Event): void {
    event.stopPropagation();
    this.filterDropdownOpen.update((open) => !open);
  }

  isCategorySelected(cat: string): boolean {
    return this.activeCategories().includes(cat);
  }

  toggleCategory(cat: string): void {
    this.activeCategories.update((cats) =>
      cats.includes(cat) ? cats.filter((c) => c !== cat) : [...cats, cat]
    );
  }

  removeCategory(cat: string): void {
    this.activeCategories.update((cats) => cats.filter((c) => c !== cat));
  }

  clearAllFilters(): void {
    this.searchQuery.set('');
    this.activeCategories.set([]);
    this.activeTab.set('all');
    this.loadReport(1);
  }

  openBuildTestModal(): void {
    this.gamsatModalService.openBuildTestModal();
  }

  startTest(course: GamsatCourseItem, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.startingTestId()) {
      return;
    }
    this.startingTestId.set(course.id);

    const isPYQ = course.source === 'previous_year' || course.type === 'PREVIOUS YEAR';
    const paperId = course.paperId || course.rawItem?.paperId || course.rawItem?.previous_year_paper_id || (course.id.startsWith('pyq_') ? course.id.replace('pyq_', '') : course.id);

    console.log('[ GAMSAT ] Start Test', { paperId, isPYQ, courseId: course.id });

    if (isPYQ) {
      this.router.navigate(['/dynamic/gamsat/previous-year'], {
        queryParams: { paperId, start: 'true' }
      }).then(() => this.startingTestId.set(null)).catch(() => this.startingTestId.set(null));
    } else {
      const raw = course.rawItem;
      const isCustom = course.source === 'custom' || course.type.toLowerCase().includes('custom');

      if (isCustom) {
        const qCount = raw?.total_questions || raw?.totalQuestions || (typeof course.stagesCount === 'string' ? parseInt(course.stagesCount, 10) : 40);
        const duration = raw?.duration_minutes || raw?.durationMinutes || 79;

        const customStartPayload: GamsatStartTestRequest = {
          title: course.title,
          custom_test_id: raw?.custom_test_id || raw?.testId || raw?.test_id,
          test_id: raw?.custom_test_id || raw?.testId || raw?.test_id,
          sections: raw?.sections && raw.sections.length > 0 ? raw.sections : undefined,
          topics: raw?.topic_ids || raw?.topics,
          topic_ids: raw?.topic_ids || raw?.topics,
          total_questions: qCount,
          limit: qCount,
          duration: duration,
          duration_minutes: duration,
          difficulty: raw?.difficulty || raw?.level || course.level,
          level: raw?.level || course.level,
          test_type: 'CUSTOM'
        };

        console.log('[ GAMSAT ] Starting Custom Test from Learning Report', customStartPayload);

        this.gamsatService.startTest(customStartPayload).subscribe({
          next: (startRes) => {
            this.startingTestId.set(null);
            const sessionData = (startRes.data ?? startRes) as any;
            const sid = startRes.sessionId || sessionData?.sessionId || (startRes as any)?.session_id || sessionData?.session_id;

            if (sid) {
              this.router.navigate(['/dynamic/gamsat/practice'], {
                queryParams: { sessionId: sid }
              });
            } else {
              const testId = course.testId || course.rawItem?.testId || course.rawItem?.custom_test_id || course.id;
              this.router.navigate(['/dynamic/gamsat/practice'], {
                queryParams: { testId, start: 'true' }
              });
            }
          },
          error: (err) => {
            this.startingTestId.set(null);
            this.errorMessage.set(this.getErrorMessage(err, 'Unable to start test session. Please try again.'));
          }
        });
      } else {
        const testId = course.testId || course.rawItem?.testId || course.rawItem?.builtin_test_id || course.id;
        this.router.navigate(['/dynamic/gamsat/practice'], {
          queryParams: { testId, start: 'true' }
        }).then(() => this.startingTestId.set(null)).catch(() => this.startingTestId.set(null));
      }
    }
  }

  resumeTest(course: GamsatCourseItem, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    const sessionId = course.sessionId || course.rawItem?.sessionId || course.id;
    const isPYQ = course.source === 'previous_year' || course.type === 'PREVIOUS YEAR';

    console.log('[ GAMSAT ] Resume Test', { sessionId, isPYQ });

    if (isPYQ) {
      this.router.navigate(['/dynamic/gamsat/previous-year'], {
        queryParams: { sessionId, resume: 'true' }
      });
    } else {
      this.router.navigate(['/dynamic/gamsat/practice'], {
        queryParams: { sessionId, resume: 'true' }
      });
    }
  }

  retestCourse(course: GamsatCourseItem, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.startingTestId()) {
      return;
    }
    this.startingTestId.set(course.id);

    const isPYQ = course.source === 'previous_year' || course.type === 'PREVIOUS YEAR';
    const paperId = course.paperId || course.rawItem?.paperId || course.rawItem?.previous_year_paper_id || (course.id.startsWith('pyq_') ? course.id.replace('pyq_', '') : course.id);

    console.log('[ GAMSAT ] Retest', {
      oldSessionId: course.sessionId,
      paperId,
      isPYQ
    });

    if (isPYQ) {
      this.router.navigate(['/dynamic/gamsat/previous-year'], {
        queryParams: { paperId, start: 'true' }
      }).then(() => this.startingTestId.set(null)).catch(() => this.startingTestId.set(null));
    } else {
      const raw = course.rawItem;
      const isCustom = course.source === 'custom' || course.type.toLowerCase().includes('custom');

      if (isCustom) {
        const qCount = raw?.total_questions || raw?.totalQuestions || (typeof course.stagesCount === 'string' ? parseInt(course.stagesCount, 10) : 40);
        const duration = raw?.duration_minutes || raw?.durationMinutes || 79;

        const customStartPayload: GamsatStartTestRequest = {
          title: course.title,
          custom_test_id: raw?.custom_test_id || raw?.testId || raw?.test_id,
          test_id: raw?.custom_test_id || raw?.testId || raw?.test_id,
          sections: raw?.sections && raw.sections.length > 0 ? raw.sections : undefined,
          topics: raw?.topic_ids || raw?.topics,
          topic_ids: raw?.topic_ids || raw?.topics,
          total_questions: qCount,
          limit: qCount,
          duration: duration,
          duration_minutes: duration,
          difficulty: raw?.difficulty || raw?.level || course.level,
          level: raw?.level || course.level,
          test_type: 'CUSTOM'
        };

        this.gamsatService.startTest(customStartPayload).subscribe({
          next: (startRes) => {
            this.startingTestId.set(null);
            const sessionData = (startRes.data ?? startRes) as any;
            const sid = startRes.sessionId || sessionData?.sessionId || (startRes as any)?.session_id || sessionData?.session_id;

            if (sid) {
              this.router.navigate(['/dynamic/gamsat/practice'], {
                queryParams: { sessionId: sid }
              });
            } else {
              const testId = course.testId || course.rawItem?.testId || course.rawItem?.custom_test_id || course.id;
              this.router.navigate(['/dynamic/gamsat/practice'], {
                queryParams: { testId, start: 'true' }
              });
            }
          },
          error: (err) => {
            this.startingTestId.set(null);
            this.errorMessage.set(this.getErrorMessage(err, 'Unable to start test session. Please try again.'));
          }
        });
      } else {
        const testId = course.testId || course.rawItem?.testId || course.rawItem?.custom_test_id || course.id;
        this.router.navigate(['/dynamic/gamsat/practice'], {
          queryParams: { testId, start: 'true' }
        }).then(() => this.startingTestId.set(null)).catch(() => this.startingTestId.set(null));
      }
    }
  }

  viewResults(course: GamsatCourseItem, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    const sessionId = course.sessionId || course.rawItem?.sessionId || course.id;
    const isPYQ = course.source === 'previous_year' || course.type === 'PREVIOUS YEAR';

    console.log('[ GAMSAT ] View Results', { sessionId, isPYQ });

    if (isPYQ) {
      this.router.navigate(['/dynamic/gamsat/previous-year'], {
        queryParams: { sessionId, view: 'result' }
      });
    } else {
      this.router.navigate(['/dynamic/gamsat/practice'], {
        queryParams: { sessionId, view: 'result' }
      });
    }
  }

  startOrResumeTest(course: GamsatCourseItem, event?: MouseEvent): void {
    if (course.rawStatus === 'not_started') {
      this.startTest(course, event);
    } else if (course.rawStatus === 'in_progress') {
      this.resumeTest(course, event);
    } else if (course.rawStatus === 'completed') {
      this.viewResults(course, event);
    }
  }

  private setupIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined' || !this.sentinelRef?.nativeElement) {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !this.isLoading() && !this.isLoadingMore()) {
          if (this.currentPage() < this.totalPages()) {
            this.loadReport(this.currentPage() + 1, true);
          }
        }
      },
      { root: null, rootMargin: '100px', threshold: 0.1 }
    );

    this.observer.observe(this.sentinelRef.nativeElement);
  }

  private formatSectionName(code: string): string {
    const c = (code || '').toUpperCase();
    if (c.includes('WRITTEN') || c === 'SECTION_I' || c === '1') return 'Written Communication';
    if (c.includes('HUMANITIES') || c.includes('SOCIAL') || c === 'SECTION_II' || c === '2') return 'Humanities & Social Sciences';
    if (c.includes('BIOLOGICAL') || c.includes('PHYSICAL') || c === 'SECTION_III' || c === '3') return 'Biological & Physical Sciences';
    return code.replace(/_/g, ' ');
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null) {
      const err = error as { error?: { message?: string }; message?: string };
      return err.error?.message || err.message || fallback;
    }
    return fallback;
  }
}
