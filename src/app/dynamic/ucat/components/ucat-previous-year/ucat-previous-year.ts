import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  UcatActiveSession,
  UcatOption,
  UcatQuestion,
  UcatQuestionState,
  UcatResultQuestion,
  UcatTestResult
} from '../../models/ucat.model';
import { UcatPreviousYearPaper } from '../../models/ucat-previous-year.model';
import { UcatPreviousYearService } from '../../services/ucat-previous-year.service';
import { UcatStreakService } from '../../services/ucat-streak.service';
import { UcatStreakData } from '../../models/ucat-streak.model';
import { TokenService } from '../../../../auth/services/token.service';

type PreviousYearViewMode = 'papers' | 'config' | 'test' | 'result';
type ResultFilter = 'all' | 'correct' | 'wrong' | 'skipped';

@Component({
  selector: 'app-ucat-previous-year',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ucat-previous-year.html',
  styleUrl: './ucat-previous-year.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UcatPreviousYear implements OnInit, OnDestroy {
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private currentQuestionTimeSpent = 0;
  private questionTimerInterval: ReturnType<typeof setInterval> | null = null;

  // Navigation & View State
  readonly view = signal<PreviousYearViewMode>('papers');
  readonly searchQuery = signal<string>('');

  // Paper List State
  readonly papers = signal<UcatPreviousYearPaper[]>([]);
  readonly selectedPaper = signal<UcatPreviousYearPaper | null>(null);

  // Test Configuration State
  readonly questionLimit = signal<number>(30);
  readonly testDuration = signal<number>(120);
  readonly limitOptions = [10, 20, 30, 50, 100, 233];
  readonly durationOptions = [30, 45, 60, 90, 120];

  // Loading & Error States
  readonly isLoadingPapers = signal(false);
  readonly isStartingTest = signal(false);
  readonly isSubmittingTest = signal(false);
  readonly isLoadingResult = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Reused Test Runner State
  readonly activeSession = signal<UcatActiveSession | null>(null);
  readonly currentQuestionIndex = signal(0);
  readonly questionStates = signal<UcatQuestionState[]>([]);
  readonly remainingSeconds = signal(0);
  readonly showReviewModal = signal(false);

  // Reused Result State
  readonly testResult = signal<UcatTestResult | null>(null);
  readonly resultFilter = signal<ResultFilter>('all');

  readonly optionKeys: UcatOption[] = ['A', 'B', 'C', 'D'];

  // Computeds
  readonly filteredPapers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const list = this.papers();
    if (!query) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.paper_id.toString().includes(query)
    );
  });

  readonly currentQuestion = computed<UcatQuestion | null>(() => {
    const session = this.activeSession();
    if (!session || !session.questions.length) return null;
    return session.questions[this.currentQuestionIndex()] ?? null;
  });

  readonly currentQuestionState = computed<UcatQuestionState | null>(() => {
    const states = this.questionStates();
    return states[this.currentQuestionIndex()] ?? null;
  });

  readonly answeredCount = computed(() =>
    this.questionStates().filter((st) => st.selectedOption !== null).length
  );

  readonly skippedCount = computed(() =>
    this.questionStates().filter((st) => st.selectedOption === null).length
  );

  readonly formattedRemainingTime = computed(() => {
    const totalSec = this.remainingSeconds();
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  readonly filteredReview = computed<UcatResultQuestion[]>(() => {
    const result = this.testResult();
    if (!result) return [];
    const filter = this.resultFilter();
    const reviews: UcatResultQuestion[] =
      (result as any).questions || result.review || [];

    if (filter === 'all') return reviews;
    if (filter === 'correct')
      return reviews.filter((r) => r.isCorrect || r.is_correct);
    if (filter === 'wrong')
      return reviews.filter(
        (r) =>
          !(r.isCorrect || r.is_correct) &&
          !r.is_skipped &&
          (r.selected || r.selected_option)
      );
    if (filter === 'skipped')
      return reviews.filter(
        (r) => r.is_skipped || (!r.selected && !r.selected_option)
      );

    return reviews;
  });

  readonly streakData = signal<UcatStreakData | null>(null);

  constructor(
    private readonly previousYearService: UcatPreviousYearService,
    private readonly ucatStreakService: UcatStreakService,
    private readonly tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.loadPapers();
    this.loadStreak();
  }

  loadStreak(): void {
    this.ucatStreakService.getStreak().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.streakData.set(res.data);
        }
      },
      error: () => {
        // Silently handle error
      }
    });
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  // --- Step 1: Load Papers ---
  loadPapers(): void {
    this.isLoadingPapers.set(true);
    this.errorMessage.set(null);

    this.previousYearService.getPreviousYearPapers().subscribe({
      next: (res) => {
        this.isLoadingPapers.set(false);
        if (res && res.data) {
          this.papers.set(res.data);
        }
      },
      error: () => {
        this.isLoadingPapers.set(false);
        this.errorMessage.set('Failed to load Previous Year Papers. Please try again.');
      }
    });
  }

  selectPaper(paper: UcatPreviousYearPaper): void {
    this.selectedPaper.set(paper);
    this.questionLimit.set(Math.min(30, paper.question_count));
    this.testDuration.set(paper.duration || 120);
    this.view.set('config');
  }

  backToPaperList(): void {
    this.selectedPaper.set(null);
    this.view.set('papers');
  }

  // --- Step 2: Start Previous Year Test ---
  onStartTest(): void {
    const paper = this.selectedPaper();
    if (!paper) {
      this.errorMessage.set('Please select a Previous Year Paper to start.');
      return;
    }

    this.isStartingTest.set(true);
    this.errorMessage.set(null);

    const payload = {
      limit: Number(this.questionLimit()),
      duration: Number(this.testDuration())
    };

    this.previousYearService
      .startPreviousYearTest(paper.paper_id, payload)
      .subscribe({
        next: (res) => {
          this.isStartingTest.set(false);
          const sessionData = (res as any)?.data || res;

          if (sessionData && (sessionData.sessionId || sessionData.questions)) {
            const questions: UcatQuestion[] =
              sessionData.questions ||
              (Array.isArray(sessionData) ? sessionData : []);

            if (!questions.length) {
              this.errorMessage.set('No questions available for this paper.');
              return;
            }

            const durationMins = sessionData.duration || payload.duration;
            const initialStates: UcatQuestionState[] = questions.map(
              (q, idx) => {
                const qId = q.question_id ?? q.id ?? q._id ?? idx;
                const existingAns = sessionData.answers?.find(
                  (a: any) => a.question_id === qId
                );
                return {
                  questionId: qId,
                  selectedOption:
                    (existingAns?.selected_option as UcatOption) || null,
                  timeSpent: existingAns?.time_spent || 0,
                  visited: idx === 0
                };
              }
            );

            this.activeSession.set({
              sessionId: sessionData.sessionId,
              durationMinutes: durationMins,
              totalQuestions: questions.length,
              questions,
              questionStates: initialStates,
              currentQuestionIndex: 0,
              startedAtTimestamp: Date.now(),
              test_type: sessionData.test_type || 'Previous Year Paper'
            });

            this.currentQuestionIndex.set(0);
            this.questionStates.set(initialStates);
            this.remainingSeconds.set(durationMins * 60);

            this.view.set('test');
            this.startMainTimer();
            this.startQuestionTimer();
          } else {
            this.errorMessage.set(res?.message || 'Failed to start test session.');
          }
        },
        error: (err) => {
          this.isStartingTest.set(false);
          const serverError =
            err?.error?.message ||
            err?.message ||
            'Failed to start Previous Year Test. Please try again.';
          this.errorMessage.set(serverError);
        }
      });
  }

  // --- Step 3: Reused Question Engine Logic ---
  private startMainTimer(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      const current = this.remainingSeconds();
      if (current <= 1) {
        this.remainingSeconds.set(0);
        this.clearTimers();
        this.onSubmitTest();
      } else {
        this.remainingSeconds.set(current - 1);
      }
    }, 1000);
  }

  private startQuestionTimer(): void {
    if (this.questionTimerInterval) clearInterval(this.questionTimerInterval);
    this.currentQuestionTimeSpent = 0;
    this.questionTimerInterval = setInterval(() => {
      this.currentQuestionTimeSpent += 1;
    }, 1000);
  }

  private saveCurrentQuestionTime(): void {
    const idx = this.currentQuestionIndex();
    const states = [...this.questionStates()];
    if (states[idx]) {
      states[idx] = {
        ...states[idx],
        timeSpent: states[idx].timeSpent + this.currentQuestionTimeSpent
      };
      this.questionStates.set(states);
    }
    this.currentQuestionTimeSpent = 0;
  }

  private clearTimers(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.questionTimerInterval) {
      clearInterval(this.questionTimerInterval);
      this.questionTimerInterval = null;
    }
  }

  selectOption(option: UcatOption): void {
    this.saveCurrentQuestionTime();
    const idx = this.currentQuestionIndex();
    const states = [...this.questionStates()];
    if (states[idx]) {
      states[idx] = {
        ...states[idx],
        selectedOption: states[idx].selectedOption === option ? null : option,
        visited: true
      };
      this.questionStates.set(states);
    }
    this.startQuestionTimer();
  }

  jumpToQuestion(index: number): void {
    if (index < 0 || index >= this.questionStates().length) return;
    this.saveCurrentQuestionTime();

    const states = [...this.questionStates()];
    if (states[index]) {
      states[index] = { ...states[index], visited: true };
      this.questionStates.set(states);
    }

    this.currentQuestionIndex.set(index);
    this.showReviewModal.set(false);
    this.startQuestionTimer();
  }

  prevQuestion(): void {
    const current = this.currentQuestionIndex();
    if (current > 0) {
      this.jumpToQuestion(current - 1);
    }
  }

  nextQuestion(): void {
    const current = this.currentQuestionIndex();
    if (current < this.questionStates().length - 1) {
      this.jumpToQuestion(current + 1);
    }
  }

  openReviewModal(): void {
    this.saveCurrentQuestionTime();
    this.showReviewModal.set(true);
  }

  closeReviewModal(): void {
    this.showReviewModal.set(false);
  }

  // --- Step 4: Submit & Result Fetching ---
  onSubmitTest(): void {
    this.saveCurrentQuestionTime();
    this.clearTimers();
    this.showReviewModal.set(false);

    const session = this.activeSession();
    if (!session) return;

    this.isSubmittingTest.set(true);
    this.errorMessage.set(null);

    const answers = this.questionStates()
      .filter((st) => st.selectedOption !== null)
      .map((st) => ({
        question_id:
          typeof st.questionId === 'string' && !isNaN(Number(st.questionId))
            ? Number(st.questionId)
            : st.questionId,
        selected_option: String(st.selectedOption),
        time_spent: Number(st.timeSpent || 0)
      }));

    const payload = {
      sessionId: session.sessionId,
      answers
    };

    this.previousYearService.submitPreviousYearTest(payload).subscribe({
      next: () => {
        this.isSubmittingTest.set(false);
        // Record streak after test submission succeeds
        this.ucatStreakService.recordStreak('PREVIOUS_YEAR_PAPER').subscribe({
          next: (res) => {
            if (res && res.data) {
              this.streakData.set(res.data);
            }
          }
        });
        // Single Source of Truth Result Fetching
        this.fetchResultAndDisplay(session.sessionId);
      },
      error: (err) => {
        this.isSubmittingTest.set(false);
        const msg =
          err?.error?.message ||
          err?.message ||
          'Submission failed. Please try again.';
        this.errorMessage.set(msg);
      }
    });
  }

  fetchResultAndDisplay(sessionId: string): void {
    this.isLoadingResult.set(true);
    this.errorMessage.set(null);

    this.previousYearService.getPreviousYearTestResult(sessionId).subscribe({
      next: (res) => {
        this.isLoadingResult.set(false);
        const resultObj: UcatTestResult =
          (res as any)?.data?.sessionId || (res as any)?.sessionId
            ? ((res as any)?.data || res)
            : (res as any)?.data || (res as any);

        if (resultObj) {
          this.testResult.set(resultObj);
          this.view.set('result');
        } else {
          this.errorMessage.set('Failed to render test result.');
        }
      },
      error: (err) => {
        this.isLoadingResult.set(false);
        const msg =
          err?.error?.message ||
          err?.message ||
          'Failed to load test result details.';
        this.errorMessage.set(msg);
      }
    });
  }

  restartWizard(): void {
    this.clearTimers();
    this.activeSession.set(null);
    this.testResult.set(null);
    this.selectedPaper.set(null);
    this.view.set('papers');
  }

  setResultFilter(filter: ResultFilter): void {
    this.resultFilter.set(filter);
  }
}
