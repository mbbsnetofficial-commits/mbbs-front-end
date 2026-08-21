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
import { Router, RouterLink } from '@angular/router';

import { TestOption } from '../../models/quick-test.model';
import {
  ActivePreviousYearTest,
  CompletedPreviousYearTest,
  PreviousYearPaper,
  PreviousYearQuestion,
  PreviousYearQuestionState,
  PreviousYearReviewQuestion,
  SaveAnswerRequest,
  StartPreviousYearTestResponse,
  SubmitPreviousYearTestResponse,
  TestStartRequest
} from '../../models/previous-year.model';
import { PreviousYearTestService } from '../../services/previous-year.service';

type PreviousYearView = 'papers' | 'configure' | 'test' | 'result';
type ResultFilter = 'all' | 'correct' | 'wrong';

@Component({
  selector: 'app-previous-year-questions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './previous-year.html',
  styleUrl: './previous-year.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviousYear implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly activeStorageKey = 'activePreviousYearTest';
  private readonly resultStorageKey = 'completedPreviousYearTest';
  private timerId: ReturnType<typeof setInterval> | null = null;
  private questionEnteredAt = Date.now();

  readonly view = signal<PreviousYearView>('papers');
  readonly papers = signal<PreviousYearPaper[]>([]);
  readonly selectedPaper = signal<PreviousYearPaper | null>(null);
  readonly duration = signal(200);
  readonly isLoading = signal(false);
  readonly isStarting = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly autosaveStatus = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  readonly autosaveError = signal<string | null>(null);

  readonly activeSession = signal<ActivePreviousYearTest | null>(null);
  readonly currentQuestionIndex = signal(0);
  readonly questionStates = signal<PreviousYearQuestionState[]>([]);
  readonly remainingSeconds = signal(0);
  readonly result = signal<SubmitPreviousYearTestResponse | null>(null);
  readonly resultFilter = signal<ResultFilter>('all');

  readonly optionKeys: TestOption[] = ['A', 'B', 'C', 'D'];

  readonly availablePaperCount = computed(() =>
    this.papers().filter((paper) => this.isPaperAvailable(paper)).length
  );

  readonly currentQuestion = computed<PreviousYearQuestion | null>(() =>
    this.activeSession()?.questions[this.currentQuestionIndex()] ?? null
  );

  readonly currentQuestionState = computed<PreviousYearQuestionState | null>(
    () => this.questionStates()[this.currentQuestionIndex()] ?? null
  );

  readonly answeredCount = computed(() =>
    this.questionStates().filter((state) => state.selectedOption !== null).length
  );

  readonly markedCount = computed(() =>
    this.questionStates().filter((state) => state.markedForReview).length
  );

  readonly formattedTime = computed(() => {
    const totalSeconds = this.remainingSeconds();
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const clock = [minutes, seconds]
      .map((value) => value.toString().padStart(2, '0'))
      .join(':');
    return hours > 0
      ? `${hours.toString().padStart(2, '0')}:${clock}`
      : clock;
  });

  readonly reviewedQuestions = computed<PreviousYearReviewQuestion[]>(() => {
    const result = this.result();
    const session = this.activeSession();
    if (!result || !session) {
      return [];
    }

    const questions = new Map(
      session.questions.map((question) => [question.id, question])
    );
    const states = new Map(
      this.questionStates().map((state) => [state.questionId, state])
    );

    return result.review.flatMap((reviewItem) => {
      const question = questions.get(reviewItem.question_id);
      if (!question) {
        return [];
      }
      return [{
        question,
        result: reviewItem,
        timeSpent: states.get(reviewItem.question_id)?.timeSpent ?? 0
      }];
    });
  });

  readonly filteredReview = computed(() => {
    const review = this.reviewedQuestions();
    switch (this.resultFilter()) {
      case 'correct':
        return review.filter((item) => item.result.isCorrect);
      case 'wrong':
        return review.filter((item) => !item.result.isCorrect);
      default:
        return review;
    }
  });

  readonly wrongQuestions = computed(() =>
    this.reviewedQuestions().filter((item) => !item.result.isCorrect)
  );

  constructor(
    private readonly previousYearTestService: PreviousYearTestService
  ) {}

  ngOnInit(): void {
    if (this.restoreCompletedTest() || this.restoreActiveTest()) {
      return;
    }
    this.loadPapers();
  }

  ngOnDestroy(): void {
    this.recordCurrentQuestionTime();
    this.persistActiveTest();
    this.stopTimer();
  }

  loadPapers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.previousYearTestService.getBuiltinTests().subscribe({
      next: (response) => {
        this.papers.set(Array.isArray(response?.data) ? response.data : []);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(
          this.getErrorMessage(error, 'Unable to load tests.')
        );
        this.isLoading.set(false);
      }
    });
  }

  isPaperAvailable(paper: PreviousYearPaper): boolean {
    if (paper.is_active === false) {
      return false;
    }
    const count =
      paper.total_questions ??
      paper.question_count ??
      paper.mapped_question_count ??
      0;
    return count > 0;
  }

  selectPaper(paper: PreviousYearPaper): void {
    if (!this.isPaperAvailable(paper) || this.isLoading()) {
      return;
    }

    this.selectedPaper.set(paper);
    this.duration.set(
      Math.max(
        1,
        paper.duration_minutes ||
          paper.total_questions ||
          paper.question_count ||
          180
      )
    );
    this.view.set('configure');
  }

  backToPapers(): void {
    this.selectedPaper.set(null);
    this.errorMessage.set(null);
    this.view.set('papers');
  }

  updateDuration(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.duration.set(Number.isFinite(value) ? Math.min(300, Math.max(1, value)) : 1);
  }

  startTest(): void {
    const paper = this.selectedPaper();
    if (!paper || !this.isPaperAvailable(paper) || this.isStarting()) {
      return;
    }

    this.isStarting.set(true);
    this.errorMessage.set(null);

    let startPayload: TestStartRequest;
    if (paper.source === 'previous_year' && paper.previous_year_paper_id) {
      startPayload = { previous_year_paper_id: paper.previous_year_paper_id };
    } else if (paper.builtin_test_id) {
      startPayload = { builtin_test_id: paper.builtin_test_id };
    } else if (paper.test_code) {
      startPayload = { test_code: paper.test_code };
    } else if (paper.source === 'previous_year') {
      startPayload = { previous_year_paper_id: paper.id || paper.test_id };
    } else {
      startPayload = { builtin_test_id: paper.test_id || paper.id };
    }

    this.previousYearTestService.startTest(startPayload).subscribe({
      next: (response) => {
        if (!response.sessionId || !response.data?.length) {
          this.errorMessage.set('The paper started without any questions.');
          this.isStarting.set(false);
          return;
        }
        this.createSession(response);
        this.isStarting.set(false);
      },
      error: (error) => {
        this.errorMessage.set(
          this.getErrorMessage(error, 'Unable to start this paper.')
        );
        this.isStarting.set(false);
      }
    });
  }

  selectOption(option: TestOption): void {
    if (this.isSubmitting()) {
      return;
    }

    const currentQuestion = this.currentQuestion();
    const currentState = this.currentQuestionState();
    if (!currentQuestion) {
      return;
    }

    if (currentState?.selectedOption === option) {
      return;
    }

    this.updateCurrentState({ selectedOption: option });

    const session = this.activeSession();
    if (session?.sessionId) {
      this.autosaveAnswer(
        session.sessionId,
        currentQuestion.id,
        option,
        currentState?.timeSpent || 0
      );
    }
  }

  clearResponse(): void {
    if (this.isSubmitting()) {
      return;
    }

    const currentQuestion = this.currentQuestion();
    const currentState = this.currentQuestionState();
    if (!currentQuestion || currentState?.selectedOption === null) {
      return;
    }

    this.updateCurrentState({ selectedOption: null });

    const session = this.activeSession();
    if (session?.sessionId) {
      this.autosaveAnswer(
        session.sessionId,
        currentQuestion.id,
        null,
        currentState?.timeSpent || 0
      );
    }
  }

  private autosaveAnswer(
    sessionId: string,
    questionId: number,
    selectedOption: TestOption | string | null,
    timeSpent: number
  ): void {
    this.autosaveStatus.set('saving');
    this.autosaveError.set(null);

    const payload: SaveAnswerRequest = {
      question_id: questionId,
      selected_option: selectedOption,
      time_spent: timeSpent
    };

    this.previousYearTestService.saveAnswer(sessionId, payload).subscribe({
      next: () => {
        this.autosaveStatus.set('saved');
      },
      error: (error) => {
        this.autosaveStatus.set('error');
        this.autosaveError.set(
          this.getErrorMessage(error, 'Unable to save answer.')
        );
      }
    });
  }

  toggleMarkForReview(): void {
    const state = this.currentQuestionState();
    if (state) {
      this.updateCurrentState({
        markedForReview: !state.markedForReview
      });
    }
  }

  goToQuestion(index: number): void {
    const session = this.activeSession();
    if (!session || index < 0 || index >= session.questions.length) {
      return;
    }

    this.recordCurrentQuestionTime();
    this.currentQuestionIndex.set(index);
    this.questionEnteredAt = Date.now();
    this.updateCurrentState({ visited: true });
  }

  previousQuestion(): void {
    this.goToQuestion(this.currentQuestionIndex() - 1);
  }

  nextQuestion(): void {
    this.goToQuestion(this.currentQuestionIndex() + 1);
  }

  requestSubmit(): void {
    this.submitTest(false);
  }

  submitTest(automatic: boolean = false): void {
    const session = this.activeSession();
    if (!session || this.isSubmitting()) {
      return;
    }

    this.recordCurrentQuestionTime();
    this.stopTimer();
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const answers = this.questionStates()
      .filter((state) => state.selectedOption !== null)
      .map((state) => ({
        question_id: state.questionId,
        selected_option: state.selectedOption as TestOption,
        time_spent: state.timeSpent
      }));

    this.previousYearTestService.submitTest({
      sessionId: session.sessionId,
      answers
    }).subscribe({
      next: (response) => {
        const raw = response as any;
        const resData = raw?.data || raw;

        const totalQ = session.totalQuestions || session.questions.length || 1;
        const correctCount = resData.correct ?? resData.correct_answers ?? resData.correctCount ?? 0;
        const wrongCount = resData.wrong ?? resData.incorrect ?? resData.wrong_answers ?? resData.wrongCount ?? 0;
        const skippedCount = resData.skipped ?? resData.unanswered ?? resData.skippedCount ?? Math.max(0, totalQ - (correctCount + wrongCount));

        let accuracyVal = resData.accuracy;
        if (typeof accuracyVal !== 'number') {
          if (typeof resData.percentage === 'number') {
            accuracyVal = resData.percentage;
          } else {
            const attempted = correctCount + wrongCount;
            accuracyVal = attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0;
          }
        }

        const normalizedResult: SubmitPreviousYearTestResponse = {
          success: raw.success ?? true,
          score: resData.score ?? resData.total_score ?? resData.totalMarks ?? 0,
          correct: correctCount,
          wrong: wrongCount,
          skipped: skippedCount,
          accuracy: accuracyVal,
          review: Array.isArray(resData.review) ? resData.review : (Array.isArray(resData.answers) ? resData.answers : []),
          message: raw.message
        };

        this.result.set(normalizedResult);
        this.resultFilter.set('all');
        this.view.set('result');
        this.isSubmitting.set(false);
        sessionStorage.removeItem(this.activeStorageKey);
        this.persistCompletedTest();
      },
      error: (error) => {
        this.errorMessage.set(
          this.getErrorMessage(
            error,
            automatic
              ? 'Time is up, but submission failed. Please retry.'
              : 'Unable to submit the paper. Your answers are saved.'
          )
        );
        this.isSubmitting.set(false);
        this.persistActiveTest();
        if (this.remainingSeconds() > 0) {
          this.startTimer();
        }
      }
    });
  }

  retrySubmission(): void {
    this.submitTest(true);
  }

  setResultFilter(filter: ResultFilter): void {
    this.resultFilter.set(filter);
  }

  backToLearningReport(): void {
    this.stopTimer();
    sessionStorage.removeItem(this.activeStorageKey);
    sessionStorage.removeItem(this.resultStorageKey);
    this.activeSession.set(null);
    this.questionStates.set([]);
    this.result.set(null);
    this.selectedPaper.set(null);
    this.errorMessage.set(null);
    void this.router.navigate(['/dynamic/neet']);
  }

  startAnotherPaper(): void {
    this.backToLearningReport();
  }

  questionStatusClass(index: number): string {
    const state = this.questionStates()[index];
    if (!state) {
      return '';
    }
    if (state.markedForReview) {
      return 'marked';
    }
    if (state.selectedOption) {
      return 'answered';
    }
    if (state.visited) {
      return 'visited';
    }
    return '';
  }

  optionText(question: PreviousYearQuestion, option: TestOption): string {
    const key = `option_${option.toLowerCase()}` as
      'option_a' | 'option_b' | 'option_c' | 'option_d';
    return String(question[key]);
  }

  reviewOptionClass(
    review: PreviousYearReviewQuestion,
    option: TestOption
  ): string {
    if (option === review.result.correct_answer) {
      return 'correct-option';
    }
    if (option === review.result.selected && !review.result.isCorrect) {
      return 'wrong-option';
    }
    return '';
  }

  imageSource(image: string): string {
    return image.startsWith('data:')
      ? image
      : `data:image/jpeg;base64,${image}`;
  }

  formatSeconds(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }

  private createSession(response: StartPreviousYearTestResponse): void {
    const startedAt = Date.now();
    const durationMinutes = response.duration || 180;
    const durationSeconds = durationMinutes * 60;
    const states = response.data.map((question, index) => ({
      questionId: question.id,
      selectedOption: null,
      timeSpent: 0,
      markedForReview: false,
      visited: index === 0
    } satisfies PreviousYearQuestionState));

    const paperMeta: Pick<PreviousYearPaper, 'id' | 'name' | 'exam_type'> = {
      id: (response.paper && typeof response.paper.id === 'number') ? response.paper.id : (this.selectedPaper()?.id ?? 0),
      name: response.title || (response.paper && response.paper.name) || this.selectedPaper()?.test_name || 'NEET Test',
      exam_type: (response.paper && response.paper.exam_type) || 'neet'
    };

    const session: ActivePreviousYearTest = {
      sessionId: response.sessionId,
      paper: paperMeta,
      duration: durationMinutes,
      totalQuestions: response.totalQuestions || response.data.length,
      startedAt,
      expiresAt: startedAt + durationSeconds * 1000,
      questions: response.data,
      questionStates: states,
      currentQuestionIndex: 0
    };

    this.activeSession.set(session);
    this.questionStates.set(states);
    this.currentQuestionIndex.set(0);
    this.remainingSeconds.set(durationSeconds);
    this.questionEnteredAt = startedAt;
    this.view.set('test');
    this.persistActiveTest();
    this.startTimer();
  }

  private restoreActiveTest(): boolean {
    const stored = sessionStorage.getItem(this.activeStorageKey);
    if (!stored) {
      return false;
    }

    try {
      const session = JSON.parse(stored) as ActivePreviousYearTest;
      if (
        !session.sessionId ||
        !session.questions?.length ||
        session.questions.length !== session.questionStates?.length
      ) {
        throw new Error('Invalid stored session');
      }

      this.activeSession.set(session);
      this.questionStates.set(session.questionStates);
      this.currentQuestionIndex.set(
        Math.min(session.currentQuestionIndex ?? 0, session.questions.length - 1)
      );
      this.questionEnteredAt = Date.now();
      this.view.set('test');

      const remaining = Math.max(
        0,
        Math.ceil((session.expiresAt - Date.now()) / 1000)
      );
      this.remainingSeconds.set(remaining);
      if (remaining > 0) {
        this.startTimer();
      }
      return true;
    } catch {
      sessionStorage.removeItem(this.activeStorageKey);
      return false;
    }
  }

  private restoreCompletedTest(): boolean {
    const stored = sessionStorage.getItem(this.resultStorageKey);
    if (!stored) {
      return false;
    }

    try {
      const completed = JSON.parse(stored) as CompletedPreviousYearTest;
      if (!completed.session?.sessionId || !completed.result?.success) {
        throw new Error('Invalid stored result');
      }
      this.activeSession.set(completed.session);
      this.questionStates.set(completed.session.questionStates);
      this.result.set(completed.result);
      this.view.set('result');
      return true;
    } catch {
      sessionStorage.removeItem(this.resultStorageKey);
      return false;
    }
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerId = setInterval(() => {
      const session = this.activeSession();
      if (!session) {
        return;
      }
      const remaining = Math.max(
        0,
        Math.ceil((session.expiresAt - Date.now()) / 1000)
      );
      this.remainingSeconds.set(remaining);
      if (remaining === 0) {
        this.stopTimer();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private recordCurrentQuestionTime(): void {
    if (this.view() !== 'test' || !this.activeSession()) {
      return;
    }
    const elapsed = Math.max(
      0,
      Math.floor((Date.now() - this.questionEnteredAt) / 1000)
    );
    if (elapsed > 0) {
      const state = this.currentQuestionState();
      if (state) {
        this.updateCurrentState({ timeSpent: state.timeSpent + elapsed });
      }
      this.questionEnteredAt = Date.now();
    }
  }

  private updateCurrentState(
    changes: Partial<Omit<PreviousYearQuestionState, 'questionId'>>
  ): void {
    const index = this.currentQuestionIndex();
    this.questionStates.update((states) =>
      states.map((state, stateIndex) =>
        stateIndex === index ? { ...state, ...changes } : state
      )
    );
    this.persistActiveTest();
  }

  private persistActiveTest(): void {
    const session = this.activeSession();
    if (!session || this.view() === 'result') {
      return;
    }
    const storedSession: ActivePreviousYearTest = {
      ...this.sessionWithoutImages(session),
      questionStates: this.questionStates(),
      currentQuestionIndex: this.currentQuestionIndex()
    };
    this.safeSessionWrite(this.activeStorageKey, storedSession);
  }

  private persistCompletedTest(): void {
    const session = this.activeSession();
    const result = this.result();
    if (!session || !result) {
      return;
    }
    const completed: CompletedPreviousYearTest = {
      session: {
        ...this.sessionWithoutImages(session),
        questionStates: this.questionStates(),
        currentQuestionIndex: this.currentQuestionIndex()
      },
      result
    };
    this.safeSessionWrite(this.resultStorageKey, completed);
  }

  private sessionWithoutImages(
    session: ActivePreviousYearTest
  ): ActivePreviousYearTest {
    return {
      ...session,
      questions: session.questions.map(({ explanation_image, ...question }) =>
        question
      )
    };
  }

  private safeSessionWrite(key: string, value: unknown): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // The live test remains usable if browser storage is unavailable or full.
    }
  }

  private getErrorMessage(error: any, fallback: string): string {
    return error?.error?.message ?? error?.message ?? fallback;
  }
}

export { PreviousYear as PreviousYearQuestions };
