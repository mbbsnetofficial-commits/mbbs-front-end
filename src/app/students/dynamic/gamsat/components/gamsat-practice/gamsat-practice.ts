import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Icon } from '../../../../../shared/ui/icon/icon';
import {
  GamsatActiveSession,
  GamsatBuiltinTest,
  GamsatOption,
  GamsatQuestion,
  GamsatQuestionState,
  GamsatResultQuestion,
  GamsatSaveAnswerRequest,
  GamsatStartTestData,
  GamsatStartTestRequest,
  GamsatSubmitAnswer,
  GamsatTestResult
} from '../../models/gamsat.model';
import { GamsatStreakData } from '../../models/gamsat-streak.model';
import { GamsatModalService } from '../../services/gamsat-modal.service';
import { GamsatService } from '../../services/gamsat.service';
import { GamsatStreakService } from '../../services/gamsat-streak.service';
import {
  calculateGamsatProgress,
  countUniqueAnsweredQuestions
} from '../../utils/gamsat-progress.util';
import { normalizeGamsatResult } from '../../utils/gamsat-result.util';

export interface SectionQuickCard {
  code: string;
  name: string;
  subtitle: string;
  questionCount: number;
  durationMinutes: number;
  iconName: string;
  tag: string;
}

type PracticeViewMode = 'catalogue' | 'test' | 'result';
type ResultFilter = 'all' | 'correct' | 'wrong' | 'skipped';

@Component({
  selector: 'app-gamsat-practice',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Icon],
  templateUrl: './gamsat-practice.html',
  styleUrl: './gamsat-practice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GamsatPractice implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly gamsatService = inject(GamsatService);
  private readonly streakService = inject(GamsatStreakService);
  private readonly modalService = inject(GamsatModalService);

  private readonly sessionKey = 'activeGamsatPracticeSession';
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private questionTimerInterval: ReturnType<typeof setInterval> | null = null;

  // Primary view
  readonly view = signal<PracticeViewMode>('catalogue');

  // Streak state
  readonly streakData = signal<GamsatStreakData | null>(null);

  // Builtin Tests & Section Drills
  readonly builtinTests = signal<GamsatBuiltinTest[]>([]);
  readonly isBuiltinLoading = signal(false);
  readonly isStartingTest = signal(false);
  readonly startingTestId = signal<string | number | null>(null);

  readonly sectionDrills = signal<SectionQuickCard[]>([
    {
      code: 'SECTION_I',
      name: 'Section I: Reasoning in Humanities',
      subtitle: 'Passages, socio-cultural critique, and textual reasoning',
      questionCount: 75,
      durationMinutes: 100,
      iconName: 'bookmark',
      tag: 'Humanities & Social Sciences'
    },
    {
      code: 'SECTION_II',
      name: 'Section II: Written Communication',
      subtitle: 'Essay task synthesis, prompt analysis, and thematic expression',
      questionCount: 2,
      durationMinutes: 65,
      iconName: 'pencil',
      tag: 'Written Communication'
    },
    {
      code: 'SECTION_III',
      name: 'Section III: Biological & Physical Sciences',
      subtitle: 'Biology (40%), Chemistry (40%), and Physics (20%) problem solving',
      questionCount: 75,
      durationMinutes: 150,
      iconName: 'microscope',
      tag: 'Biological & Physical Sciences'
    }
  ]);

  // Exam Runner state
  readonly activeSession = signal<GamsatActiveSession | null>(null);
  readonly currentQuestionIndex = signal(0);
  readonly questionStates = signal<GamsatQuestionState[]>([]);
  readonly remainingSeconds = signal(0);
  readonly showReviewModal = signal(false);

  // Result state
  readonly testResult = signal<GamsatTestResult | null>(null);
  readonly currentResultSessionId = signal<string | null>(null);
  readonly resultFilter = signal<ResultFilter>('all');
  readonly isSubmittingTest = signal(false);
  readonly isLoadingResult = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly optionKeys: GamsatOption[] = ['A', 'B', 'C', 'D'];

  // Computeds
  readonly currentQuestion = computed<GamsatQuestion | null>(() => {
    const session = this.activeSession();
    if (!session || !session.questions || !session.questions.length) return null;
    return session.questions[this.currentQuestionIndex()] ?? null;
  });

  readonly currentQuestionState = computed<GamsatQuestionState | null>(() => {
    const states = this.questionStates();
    return states[this.currentQuestionIndex()] ?? null;
  });

  readonly answeredCount = computed(() =>
    countUniqueAnsweredQuestions(this.questionStates())
  );

  readonly totalQuestionsCount = computed(() => {
    const session = this.activeSession();
    return session?.questions?.length || this.questionStates().length || session?.totalQuestions || 0;
  });

  readonly skippedCount = computed(() => {
    const total = this.totalQuestionsCount();
    const answered = this.answeredCount();
    return Math.max(0, total - answered);
  });

  readonly progressPercentage = computed(() => {
    const total = this.totalQuestionsCount();
    const answered = this.answeredCount();
    return calculateGamsatProgress(answered, total, this.view() === 'result');
  });

  readonly formattedRemainingTime = computed(() => {
    const totalSec = this.remainingSeconds();
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const mmss = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return hours > 0 ? `${hours.toString().padStart(2, '0')}:${mmss}` : mmss;
  });

  readonly allReviewQuestions = computed<GamsatResultQuestion[]>(() => {
    const result = this.testResult();
    if (!result) return [];
    return (result as any).questions || result.review || [];
  });

  readonly resultTestTitle = computed<string>(() => {
    const session = this.activeSession();
    if (session?.testName) return session.testName;
    const res = this.testResult();
    if (res?.testName) return res.testName;
    if (res?.test_type) return res.test_type.replace(/_/g, ' ');
    return 'GAMSAT Practice Test';
  });

  readonly filteredReview = computed<GamsatResultQuestion[]>(() => {
    const reviews = this.allReviewQuestions();
    const filter = this.resultFilter();

    if (filter === 'all') return reviews;
    if (filter === 'correct') {
      return reviews.filter((r) => r.isCorrect || r.is_correct);
    }
    if (filter === 'wrong') {
      return reviews.filter(
        (r) =>
          !(r.isCorrect || r.is_correct) &&
          !r.is_skipped &&
          (r.selected || r.selected_option)
      );
    }
    if (filter === 'skipped') {
      return reviews.filter(
        (r) => r.is_skipped || (!r.selected && !r.selected_option)
      );
    }

    return reviews;
  });

  ngOnInit(): void {
    const restored = this.restoreSessionFromStorage();
    if (!restored) {
      this.checkQueryParams();
    }
    this.loadStreak();
    this.loadBuiltinTests();
  }

  ngOnDestroy(): void {
    this.stopTimers();
  }

  loadStreak(): void {
    this.streakService.getStreak().subscribe({
      next: (res) => {
        if (res.data) {
          this.streakData.set(res.data);
        }
      },
      error: () => {}
    });
  }

  loadBuiltinTests(): void {
    this.isBuiltinLoading.set(true);
    this.errorMessage.set(null);

    this.gamsatService.getBuiltinTests().subscribe({
      next: (res) => {
        const tests = (res.data ?? []) as GamsatBuiltinTest[];
        this.builtinTests.set(tests);
        this.isBuiltinLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(this.getErrorMessage(err, 'Unable to load practice tests.'));
        this.isBuiltinLoading.set(false);
      }
    });
  }

  openBuildTestModal(): void {
    this.modalService.openBuildTestModal();
  }

  startBuiltinTest(test: GamsatBuiltinTest): void {
    const testId = test.id || test.builtin_test_id || test.test_id;
    if (this.startingTestId()) return;

    this.clearSessionStorage();
    this.startingTestId.set(testId || null);
    this.errorMessage.set(null);

    console.log('[ GAMSAT ] Start Practice Test', { testId });

    const payload: GamsatStartTestRequest = {
      builtin_test_id: test.builtin_test_id || test.id,
      test_id: testId,
      duration: test.duration_minutes,
      total_questions: test.total_questions
    };

    this.gamsatService.startTest(payload).subscribe({
      next: (res) => {
        this.startingTestId.set(null);
        const sessionData = (res.data ?? res) as GamsatActiveSession | GamsatStartTestData;
        if (sessionData) {
          console.log('[ GAMSAT ] Start Practice Test Success', { testId, sessionId: sessionData.sessionId });
          this.initExamSession(sessionData);
        }
      },
      error: (err) => {
        this.startingTestId.set(null);
        this.errorMessage.set(this.getErrorMessage(err, 'Failed to launch practice mock exam.'));
      }
    });
  }

  startSectionDrill(section: SectionQuickCard): void {
    if (this.startingTestId()) return;

    this.clearSessionStorage();
    this.startingTestId.set(section.code);
    this.errorMessage.set(null);

    console.log('[ GAMSAT ] Start Section Drill', { section: section.code });

    const payload: GamsatStartTestRequest = {
      sections: [section.code],
      duration: section.durationMinutes,
      limit: section.questionCount
    };

    this.gamsatService.startTest(payload).subscribe({
      next: (res) => {
        this.startingTestId.set(null);
        const sessionData = (res.data ?? res) as GamsatActiveSession | GamsatStartTestData;
        if (sessionData) {
          console.log('[ GAMSAT ] Start Section Drill Success', { section: section.code, sessionId: sessionData.sessionId });
          this.initExamSession(sessionData);
        }
      },
      error: (err) => {
        this.startingTestId.set(null);
        this.errorMessage.set(this.getErrorMessage(err, 'Failed to start section practice drill.'));
      }
    });
  }

  // Exam Initialization
  private initExamSession(sessionData: GamsatActiveSession | GamsatStartTestData | any): void {
    const status = String(sessionData.status || '').toLowerCase();
    if (status.includes('complete') || status.includes('submit')) {
      console.log('[ GAMSAT ] initExamSession: Practice session is already completed. Loading result view.', sessionData.sessionId);
      this.clearSessionStorage();
      this.loadResult(sessionData.sessionId);
      return;
    }

    const rawQuestions = Array.isArray(sessionData.questions)
      ? sessionData.questions
      : (Array.isArray(sessionData) ? sessionData : []);

    const session: GamsatActiveSession = {
      sessionId: sessionData.sessionId || 'gamsat-session',
      paperId: sessionData.paperId,
      testName: sessionData.testName || sessionData.title || 'GAMSAT Practice Exam',
      durationMinutes: sessionData.durationMinutes || sessionData.duration_minutes || sessionData.duration || 180,
      totalQuestions: sessionData.totalQuestions || sessionData.total_questions || rawQuestions.length || 0,
      startedAt: sessionData.startedAt,
      expiresAt: sessionData.expiresAt,
      remainingTimeSeconds: sessionData.remainingTimeSeconds,
      status: sessionData.status || 'IN_PROGRESS',
      questions: rawQuestions,
      currentQuestionIndex: 0,
      startedAtTimestamp: Date.now(),
      test_type: sessionData.test_type || sessionData.testType || 'PRACTICE_TEST'
    };

    this.activeSession.set(session);
    this.currentQuestionIndex.set(0);

    const initialStates: GamsatQuestionState[] = rawQuestions.map((q: GamsatQuestion, idx: number) => {
      const qId = q.questionId ?? q.question_id ?? q.id ?? (q as any)?._id;
      const existingAnswer = Array.isArray((sessionData as any).answers)
        ? (sessionData as any).answers.find((a: any) => {
            const aId = a.questionId ?? a.question_id ?? a.id ?? (a as any)?._id;
            return aId !== undefined && aId !== null && String(aId) === String(qId);
          })
        : null;

      const selectedOption = existingAnswer?.selectedOption ?? existingAnswer?.selected_option ?? existingAnswer?.answer ?? null;
      const timeSpent = typeof (existingAnswer?.timeSpent ?? existingAnswer?.time_spent) === 'number'
        ? (existingAnswer?.timeSpent ?? existingAnswer?.time_spent)
        : 0;

      return {
        questionId: qId !== undefined && qId !== null && qId !== '' ? qId : (idx + 1),
        selectedOption: selectedOption as GamsatOption | null,
        timeSpent,
        visited: idx === 0 || selectedOption !== null,
        markedForReview: false
      };
    });

    this.questionStates.set(initialStates);

    let remaining = 0;
    if (session.remainingTimeSeconds !== undefined && session.remainingTimeSeconds > 0) {
      remaining = session.remainingTimeSeconds;
    } else if (session.expiresAt) {
      const expMs = typeof session.expiresAt === 'number' ? session.expiresAt : Date.parse(String(session.expiresAt));
      if (!isNaN(expMs)) {
        remaining = Math.max(0, Math.ceil((expMs - Date.now()) / 1000));
      }
    } else if (session.durationMinutes) {
      remaining = session.durationMinutes * 60;
    }

    this.remainingSeconds.set(remaining);
    this.view.set('test');
    this.startTimers();
    this.saveSessionToStorage();

    if (sessionData.sessionId) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { sessionId: sessionData.sessionId },
        replaceUrl: true
      });
    }
  }

  // Question Navigation & Answer Selection
  selectOption(option: GamsatOption): void {
    const session = this.activeSession();
    if (!session || this.isSubmittingTest() || this.view() !== 'test') {
      return;
    }

    const sessionStatus = String(session.status || '').toLowerCase();
    if (sessionStatus.includes('complete') || sessionStatus.includes('submit')) {
      console.warn('[ GAMSAT ] Autosave blocked: session is already completed', session.sessionId);
      this.stopTimers();
      this.clearSessionStorage();
      this.loadResult(session.sessionId);
      return;
    }

    const idx = this.currentQuestionIndex();
    const states = [...this.questionStates()];
    if (!states[idx]) return;

    const currentSelected = states[idx].selectedOption;
    const newSelected = currentSelected === option ? null : option;
    states[idx] = { ...states[idx], selectedOption: newSelected, visited: true };
    this.questionStates.set(states);
    this.saveSessionToStorage();

    if (session.sessionId && newSelected && !this.isSubmittingTest()) {
      const q = session.questions?.[idx];
      const qId = states[idx].questionId ?? q?.questionId ?? q?.question_id ?? q?.id ?? (q as any)?._id;

      if (qId === undefined || qId === null || qId === '') {
        console.error('[ GAMSAT ] Autosave failed: questionId is missing for question at index', idx, { question: q, state: states[idx] });
        return;
      }

      const timeSpent = typeof states[idx].timeSpent === 'number' && !isNaN(states[idx].timeSpent) ? states[idx].timeSpent : 0;

      const payload: GamsatSaveAnswerRequest = {
        questionId: qId,
        selectedOption: newSelected,
        timeSpent
      };

      console.log('[ GAMSAT ] Autosave', {
        sessionId: session.sessionId,
        questionId: qId,
        answered: newSelected,
        timeSpent
      });

      this.gamsatService.saveAnswer(session.sessionId, payload).subscribe({
        next: () => {},
        error: (err: any) => {
          const errCode = err?.error?.error?.code || err?.error?.code;
          if (errCode === 'TEST_ALREADY_COMPLETED') {
            console.warn('[ GAMSAT ] TEST_ALREADY_COMPLETED received during autosave. Transitioning away from active session.');
            this.stopTimers();
            this.clearSessionStorage();
            this.activeSession.set({ ...session, status: 'COMPLETED' });
            this.loadResult(session.sessionId);
          } else {
            console.warn('[ GAMSAT ] Autosave error:', err);
          }
        }
      });
    }
  }

  nextQuestion(): void {
    const idx = this.currentQuestionIndex();
    if (idx < this.questionStates().length - 1) {
      this.jumpToQuestion(idx + 1);
    }
  }

  prevQuestion(): void {
    const idx = this.currentQuestionIndex();
    if (idx > 0) {
      this.jumpToQuestion(idx - 1);
    }
  }

  skipQuestion(): void {
    this.nextQuestion();
  }

  jumpToQuestion(targetIndex: number): void {
    const states = [...this.questionStates()];
    if (targetIndex >= 0 && targetIndex < states.length) {
      states[targetIndex] = { ...states[targetIndex], visited: true };
      this.questionStates.set(states);
      this.currentQuestionIndex.set(targetIndex);
      this.closeReviewModal();
      this.saveSessionToStorage();
    }
  }

  // Submission & Review Modal
  openReviewModal(): void {
    this.showReviewModal.set(true);
  }

  closeReviewModal(): void {
    this.showReviewModal.set(false);
  }

  onSubmitTest(): void {
    const session = this.activeSession();
    if (!session?.sessionId || this.isSubmittingTest()) return;

    this.isSubmittingTest.set(true);
    this.errorMessage.set(null);
    this.stopTimers();
    this.clearSessionStorage();

    const answersPayload: GamsatSubmitAnswer[] = this.questionStates()
      .filter((st) => st.selectedOption !== null)
      .map((st) => ({
        question_id: st.questionId,
        questionId: st.questionId,
        selected_option: st.selectedOption,
        answer: st.selectedOption ?? undefined,
        time_spent: st.timeSpent,
        timeSpent: st.timeSpent
      }));

    this.gamsatService
      .submitTest({
        sessionId: session.sessionId,
        answers: answersPayload
      })
      .subscribe({
        next: (res) => {
          this.isSubmittingTest.set(false);
          this.activeSession.set({ ...session, status: 'COMPLETED' });
          this.closeReviewModal();

          const normalized = normalizeGamsatResult(res, session.sessionId);
          if (normalized && normalized.review.length > 0) {
            this.currentResultSessionId.set(session.sessionId);
            this.testResult.set(normalized);
            this.view.set('result');
            const currentParams = this.route.snapshot.queryParams;
            if (currentParams['sessionId'] !== session.sessionId || currentParams['view'] !== 'result') {
              this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { sessionId: session.sessionId, view: 'result' },
                replaceUrl: true
              });
            }
          } else {
            this.loadResult(session.sessionId);
          }
        },
        error: (err) => {
          this.isSubmittingTest.set(false);
          const errCode = err?.error?.error?.code || err?.error?.code;
          if (errCode === 'TEST_ALREADY_COMPLETED') {
            this.activeSession.set({ ...session, status: 'COMPLETED' });
            this.closeReviewModal();
            this.loadResult(session.sessionId);
          } else {
            this.errorMessage.set(this.getErrorMessage(err, 'Failed to submit examination.'));
          }
        }
      });
  }

  loadResult(sessionId: string): void {
    if (!sessionId) {
      this.isLoadingResult.set(false);
      this.errorMessage.set('Test session ID is missing. The result cannot be loaded.');
      return;
    }

    this.currentResultSessionId.set(sessionId);
    this.isLoadingResult.set(true);
    this.view.set('result');
    this.errorMessage.set(null);

    // Keep URL query params in sync only if changed
    const currentParams = this.route.snapshot.queryParams;
    if (currentParams['sessionId'] !== sessionId || currentParams['view'] !== 'result') {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { sessionId, view: 'result' },
        replaceUrl: true
      });
    }

    this.gamsatService.getTestResult(sessionId).subscribe({
      next: (res: any) => {
        this.isLoadingResult.set(false);
        const normalized = normalizeGamsatResult(res, sessionId);
        if (normalized) {
          this.testResult.set(normalized);
        } else {
          this.errorMessage.set('Result data is unavailable for this session.');
        }
      },
      error: (err) => {
        this.isLoadingResult.set(false);
        this.errorMessage.set(this.getErrorMessage(err, 'Failed to load test results.'));
      }
    });
  }

  retryLoadResult(): void {
    const session = this.activeSession();
    const sessionId = session?.sessionId || this.route.snapshot.queryParamMap.get('sessionId') || this.testResult()?.sessionId;
    if (sessionId) {
      this.loadResult(sessionId);
    } else {
      this.backToLearningReport();
    }
  }

  setResultFilter(filter: ResultFilter): void {
    this.resultFilter.set(filter);
  }

  backToLearningReport(): void {
    this.router.navigate(['/dynamic/gamsat']);
  }

  backToCatalogue(): void {
    this.router.navigate(['/dynamic/gamsat']);
  }

  // Timers Management
  private startTimers(): void {
    this.stopTimers();

    this.timerInterval = setInterval(() => {
      const rem = this.remainingSeconds();
      if (rem <= 1) {
        this.remainingSeconds.set(0);
        this.stopTimers();
        this.onSubmitTest();
      } else {
        this.remainingSeconds.set(rem - 1);
      }
    }, 1000);

    this.questionTimerInterval = setInterval(() => {
      const idx = this.currentQuestionIndex();
      const states = [...this.questionStates()];
      if (states[idx]) {
        states[idx] = { ...states[idx], timeSpent: states[idx].timeSpent + 1 };
        this.questionStates.set(states);
      }
    }, 1000);
  }

  private stopTimers(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.questionTimerInterval) {
      clearInterval(this.questionTimerInterval);
      this.questionTimerInterval = null;
    }
  }

  // Storage Persistence & Recovery
  private saveSessionToStorage(): void {
    try {
      const session = this.activeSession();
      if (!session) return;

      const minimalQuestions = (session.questions || []).map((q) => ({
        id: q.id,
        question_id: q.question_id,
        question: q.question,
        stimulus_text: q.stimulus_text,
        stimulus_image: q.stimulus_image,
        stimulus_title: q.stimulus_title,
        section: q.section,
        unit: q.unit,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d
      }));

      const lightweightData = {
        sessionId: session.sessionId,
        paperId: session.paperId,
        testName: session.testName,
        durationMinutes: session.durationMinutes,
        totalQuestions: session.totalQuestions,
        expiresAt: session.expiresAt,
        questions: minimalQuestions,
        currentQuestionIndex: this.currentQuestionIndex(),
        questionStates: this.questionStates(),
        savedAt: Date.now(),
        remainingSeconds: this.remainingSeconds()
      };
      sessionStorage.setItem(this.sessionKey, JSON.stringify(lightweightData));
    } catch {
      // Ignore quota errors
    }
  }

  private restoreSessionFromStorage(): boolean {
    try {
      const saved = sessionStorage.getItem(this.sessionKey);
      if (!saved) return false;

      const data = JSON.parse(saved);
      const status = String(data?.status || '').toLowerCase();
      if (status.includes('complete') || status.includes('submit')) {
        this.clearSessionStorage();
        return false;
      }

      if (data && data.sessionId && data.questions && data.questionStates && data.remainingSeconds > 0) {
        const session: GamsatActiveSession = {
          sessionId: data.sessionId,
          paperId: data.paperId,
          testName: data.testName,
          durationMinutes: data.durationMinutes,
          totalQuestions: data.totalQuestions,
          expiresAt: data.expiresAt,
          questions: data.questions,
          currentQuestionIndex: data.currentQuestionIndex || 0,
          startedAtTimestamp: data.savedAt || Date.now(),
          status: 'IN_PROGRESS'
        };

        this.activeSession.set(session);
        this.currentQuestionIndex.set(data.currentQuestionIndex || 0);
        this.questionStates.set(data.questionStates);

        let adjustedRem = 0;
        if (data.expiresAt) {
          const expMs = typeof data.expiresAt === 'number' ? data.expiresAt : Date.parse(String(data.expiresAt));
          if (!isNaN(expMs)) {
            adjustedRem = Math.max(0, Math.ceil((expMs - Date.now()) / 1000));
          }
        } else {
          const elapsedSec = Math.floor((Date.now() - (data.savedAt || Date.now())) / 1000);
          adjustedRem = Math.max(0, data.remainingSeconds - elapsedSec);
        }

        if (adjustedRem <= 0) {
          this.clearSessionStorage();
          return false;
        }

        this.remainingSeconds.set(adjustedRem);
        this.view.set('test');
        this.startTimers();
        return true;
      }
    } catch {
      this.clearSessionStorage();
    }
    return false;
  }

  private clearSessionStorage(): void {
    try {
      sessionStorage.removeItem(this.sessionKey);
    } catch {}
  }

  resumeSession(sessionId: string): void {
    this.isStartingTest.set(true);
    this.errorMessage.set(null);

    this.gamsatService.getSession(sessionId).subscribe({
      next: (res: any) => {
        this.isStartingTest.set(false);
        const sessionData = res?.data ?? res;
        if (!sessionData) {
          this.loadResult(sessionId);
          return;
        }

        const status = String(sessionData.status || '').toLowerCase();
        const isCompleted = status.includes('complete') || status.includes('submit');

        if (isCompleted) {
          console.log('[ GAMSAT ] Resumed practice session is completed on backend. Loading result view directly.', sessionId);
          this.clearSessionStorage();
          this.loadResult(sessionId);
        } else if (sessionData.questions && sessionData.questions.length > 0) {
          this.initExamSession(sessionData);
        } else {
          this.loadResult(sessionId);
        }
      },
      error: () => {
        this.isStartingTest.set(false);
        this.loadResult(sessionId);
      }
    });
  }

  private checkQueryParams(): void {
    this.route.queryParams.subscribe((params) => {
      const sessionId = params['sessionId'];
      const testId = params['testId'] || params['customTestId'] || params['builtinTestId'];

      if (sessionId) {
        if (params['action'] === 'result' || params['view'] === 'result') {
          if (this.view() === 'result' && this.currentResultSessionId() === sessionId) {
            return;
          }
          this.loadResult(sessionId);
        } else {
          // If we already have this exact session active, do not interrupt or re-fetch
          if (this.activeSession()?.sessionId === sessionId && this.view() === 'test') {
            return;
          }
          this.resumeSession(sessionId);
        }
      } else if (testId) {
        if (this.activeSession()?.paperId === testId && this.view() === 'test') {
          return;
        }

        // Discard any stale session storage when launching a new practice test
        this.clearSessionStorage();
        this.isStartingTest.set(true);
        this.errorMessage.set(null);

        const payload: GamsatStartTestRequest = String(testId).startsWith('SECTION_')
          ? { sections: [String(testId)], test_type: 'PRACTICE_TEST' }
          : { test_id: testId };

        this.gamsatService.startTest(payload).subscribe({
          next: (res) => {
            this.isStartingTest.set(false);
            const sessionData = (res.data ?? res) as GamsatActiveSession | GamsatStartTestData;
            if (sessionData) {
              this.initExamSession(sessionData);
            }
          },
          error: (err) => {
            this.isStartingTest.set(false);
            this.errorMessage.set(this.getErrorMessage(err, 'Failed to launch practice test.'));
          }
        });
      }
    });
  }

  // Template Helpers
  getReviewOptionText(item: GamsatResultQuestion, key: GamsatOption): string {
    if (key === 'A') return String(item.option_a ?? '');
    if (key === 'B') return String(item.option_b ?? '');
    if (key === 'C') return String(item.option_c ?? '');
    if (key === 'D') return String(item.option_d ?? '');
    return '';
  }

  reviewOptionClass(item: GamsatResultQuestion, key: GamsatOption): Record<string, boolean> {
    const isCorrect = key === item.correct_answer;
    const isSelected = key === (item.selected || item.selected_option);

    return {
      'is-correct': isCorrect,
      'is-selected': isSelected,
      'is-wrong-selection': isSelected && !isCorrect
    };
  }

  formatSeconds(totalSec: number): string {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null) {
      const err = error as { status?: number; error?: { message?: string; error?: { message?: string } }; message?: string };
      if (err.status === 401) {
        return 'Your session has expired. Please log in again.';
      }
      if (err.status === 404) {
        return 'Test result not found for this session.';
      }
      if (err.status === 0) {
        return 'Unable to connect to the server. Please check your connection.';
      }
      if (err.status && err.status >= 500) {
        return 'Unable to load the test result. Please try again.';
      }
      return err.error?.error?.message || err.error?.message || err.message || fallback;
    }
    return fallback;
  }
}
