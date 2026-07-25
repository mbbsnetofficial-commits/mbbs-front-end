import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, map, of, switchMap } from 'rxjs';

import {
  ChatMessage,
  ChatSession,
  TestOption,
  ZoneInsight
} from '../../../core/models/quick-test.model';
import {
  ActivePreviousYearTest,
  CompletedPreviousYearTest,
  PreviousYearPaper,
  PreviousYearQuestion,
  PreviousYearQuestionState,
  PreviousYearReviewQuestion,
  StartPreviousYearTestResponse,
  SubmitPreviousYearTestResponse
} from '../../../core/models/previous-year-test.model';
import { PreviousYearTestService } from '../../../core/serivce/previous-year-test.service';
import { QuickTestService } from '../../../core/serivce/quick-test.service';

type PreviousYearView = 'papers' | 'configure' | 'test' | 'result';
type ResultFilter = 'all' | 'correct' | 'wrong';
type AiPanel = 'none' | 'chat' | 'insights';

@Component({
  selector: 'app-previous-year-questions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './previous-year-questions.html',
  styleUrl: './previous-year-questions.scss',
})
export class PreviousYearQuestions implements OnInit, OnDestroy {
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

  readonly activeSession = signal<ActivePreviousYearTest | null>(null);
  readonly currentQuestionIndex = signal(0);
  readonly questionStates = signal<PreviousYearQuestionState[]>([]);
  readonly remainingSeconds = signal(0);
  readonly result = signal<SubmitPreviousYearTestResponse | null>(null);
  readonly resultFilter = signal<ResultFilter>('all');
  readonly aiPanel = signal<AiPanel>('none');
  readonly chatSession = signal<ChatSession | null>(null);
  readonly chatMessages = signal<ChatMessage[]>([]);
  readonly chatInput = signal('');
  readonly isLoadingChat = signal(false);
  readonly isSendingMessage = signal(false);
  readonly chatError = signal<string | null>(null);
  readonly zoneInsight = signal<ZoneInsight | null>(null);
  readonly isLoadingInsights = signal(false);
  readonly insightsError = signal<string | null>(null);

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
    private readonly previousYearTestService: PreviousYearTestService,
    private readonly quickTestService: QuickTestService
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

    this.previousYearTestService.getPapers('neet').subscribe({
      next: (response) => {
        this.papers.set(Array.isArray(response.data) ? response.data : []);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(
          this.getErrorMessage(error, 'Unable to load previous year papers.')
        );
        this.isLoading.set(false);
      }
    });
  }

  isPaperAvailable(paper: PreviousYearPaper): boolean {
    return Boolean(
      paper.is_active &&
      paper.mapping_available &&
      paper.mapped_question_count > 0
    );
  }

  selectPaper(paper: PreviousYearPaper): void {
    if (!this.isPaperAvailable(paper) || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.previousYearTestService.getPaper(paper.id).subscribe({
      next: (response) => {
        const selected = response.data ?? paper;
        this.selectedPaper.set(selected);
        this.duration.set(Math.max(1, selected.question_count || 200));
        this.view.set('configure');
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(
          this.getErrorMessage(error, 'Unable to load this paper.')
        );
        this.isLoading.set(false);
      }
    });
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

    this.previousYearTestService.startTest(paper.id, {
      duration: this.duration()
    }).subscribe({
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
    if (!this.isSubmitting()) {
      this.updateCurrentState({ selectedOption: option });
    }
  }

  clearResponse(): void {
    this.updateCurrentState({ selectedOption: null });
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
    const unanswered = this.questionStates().length - this.answeredCount();
    const prompt = unanswered > 0
      ? `${unanswered} question(s) are unanswered. Submit this paper anyway?`
      : 'Submit this previous year paper now?';

    if (window.confirm(prompt)) {
      this.submitTest(false);
    }
  }

  submitTest(automatic: boolean): void {
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
        this.result.set(response);
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

  openChat(questionId?: number): void {
    const session = this.activeSession();
    if (!session || !this.result()?.wrong) {
      return;
    }

    this.aiPanel.set('chat');
    this.chatError.set(null);
    this.chatInput.set(
      questionId
        ? `Explain why my answer to question ${questionId} was wrong.`
        : 'Explain all my wrong answers.'
    );

    if (this.chatSession()) {
      return;
    }

    this.isLoadingChat.set(true);
    this.ensureChatSession(session.sessionId).subscribe({
      next: (chatSession) => {
        this.chatSession.set(chatSession);
        this.loadChatMessages(chatSession._id);
      },
      error: (error) => {
        this.chatError.set(
          this.getErrorMessage(error, 'Unable to open the Gemini review chat.')
        );
        this.isLoadingChat.set(false);
      }
    });
  }

  updateChatInput(event: Event): void {
    this.chatInput.set((event.target as HTMLTextAreaElement).value);
  }

  sendMessage(): void {
    const chatSession = this.chatSession();
    const message = this.chatInput().trim();
    if (!chatSession || !message || this.isSendingMessage()) {
      return;
    }

    this.isSendingMessage.set(true);
    this.chatError.set(null);
    this.quickTestService.sendChatMessage(chatSession._id, message).subscribe({
      next: (response) => {
        this.chatMessages.update((messages) => [
          ...messages,
          response.data.userMessage,
          response.data.assistantMessage
        ]);
        this.chatInput.set('');
        this.isSendingMessage.set(false);
      },
      error: (error) => {
        this.chatError.set(
          this.getErrorMessage(error, 'Gemini could not answer right now.')
        );
        this.isSendingMessage.set(false);
      }
    });
  }

  openInsights(): void {
    const session = this.activeSession();
    if (!session || !this.result()?.wrong || this.isLoadingInsights()) {
      return;
    }

    this.aiPanel.set('insights');
    this.insightsError.set(null);
    if (this.zoneInsight()) {
      return;
    }

    this.isLoadingInsights.set(true);
    this.quickTestService.getZoneInsights(session.sessionId).subscribe({
      next: (response) => {
        this.zoneInsight.set(response.data);
        this.isLoadingInsights.set(false);
      },
      error: (error) => {
        if (error?.status === 404) {
          this.generateAndLoadInsights(session.sessionId);
          return;
        }
        this.insightsError.set(
          this.getErrorMessage(error, 'Unable to load AI insights.')
        );
        this.isLoadingInsights.set(false);
      }
    });
  }

  retryInsights(): void {
    this.zoneInsight.set(null);
    this.openInsights();
  }

  closeAiPanel(): void {
    this.aiPanel.set('none');
    this.chatError.set(null);
    this.insightsError.set(null);
  }

  insightSubjects(data: Record<string, string[]>): string[] {
    return Object.keys(data);
  }

  startAnotherPaper(): void {
    this.stopTimer();
    sessionStorage.removeItem(this.activeStorageKey);
    sessionStorage.removeItem(this.resultStorageKey);
    this.activeSession.set(null);
    this.questionStates.set([]);
    this.result.set(null);
    this.aiPanel.set('none');
    this.chatSession.set(null);
    this.chatMessages.set([]);
    this.zoneInsight.set(null);
    this.selectedPaper.set(null);
    this.errorMessage.set(null);
    this.view.set('papers');
    if (this.papers().length === 0) {
      this.loadPapers();
    }
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
    const durationSeconds = response.duration * 60;
    const states = response.data.map((question, index) => ({
      questionId: question.id,
      selectedOption: null,
      timeSpent: 0,
      markedForReview: false,
      visited: index === 0
    } satisfies PreviousYearQuestionState));

    const session: ActivePreviousYearTest = {
      sessionId: response.sessionId,
      paper: response.paper,
      duration: response.duration,
      totalQuestions: response.totalQuestions,
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

  private ensureChatSession(testSessionId: string): Observable<ChatSession> {
    return this.quickTestService.listChatSessions(1, 100).pipe(
      switchMap((response) => {
        const existing = response.data.find(
          (chat) =>
            chat.test_session_id === testSessionId &&
            chat.is_active
        );
        if (existing) {
          return of(existing);
        }

        return this.quickTestService.createChatSession({
          testSessionId,
          title: `${this.activeSession()?.paper.name ?? 'NEET Paper'} Review`
        }).pipe(map((created) => created.data));
      })
    );
  }

  private loadChatMessages(chatSessionId: string): void {
    this.quickTestService.getChatMessages(chatSessionId, 1, 100).subscribe({
      next: (response) => {
        this.chatMessages.set(response.data);
        this.isLoadingChat.set(false);
      },
      error: (error) => {
        this.chatError.set(
          this.getErrorMessage(error, 'Unable to load previous messages.')
        );
        this.isLoadingChat.set(false);
      }
    });
  }

  private generateAndLoadInsights(testSessionId: string): void {
    this.ensureChatSession(testSessionId).pipe(
      switchMap((chatSession) => {
        this.chatSession.set(chatSession);
        return this.quickTestService.generateInsights(chatSession._id);
      }),
      switchMap(() => this.quickTestService.getZoneInsights(testSessionId))
    ).subscribe({
      next: (response) => {
        this.zoneInsight.set(response.data);
        this.isLoadingInsights.set(false);
      },
      error: (error) => {
        this.insightsError.set(
          this.getErrorMessage(error, 'Unable to generate AI insights.')
        );
        this.isLoadingInsights.set(false);
      }
    });
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
      if (remaining === 0) {
        setTimeout(() => this.submitTest(true));
      } else {
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
        this.submitTest(true);
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
