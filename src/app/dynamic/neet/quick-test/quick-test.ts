import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, map, of, switchMap } from 'rxjs';

import {
  ActiveTestSession,
  ChatMessage,
  ChatSession,
  StartTestResponse,
  SubmitTestResponse,
  TestOption,
  TestQuestion,
  TestQuestionState,
  TestResult,
  TestResultQuestion,
  ZoneInsight
} from '../../../core/models/quick-test.model';
import { QuickTestService } from '../../../core/serivce/quick-test.service';

type QuickTestView = 'wizard' | 'test' | 'result';
type WizardStep = 1 | 2 | 3 | 4;
type ResultFilter = 'all' | 'correct' | 'wrong' | 'skipped';
type AiPanel = 'none' | 'chat' | 'insights';

@Component({
  selector: 'app-quick-test',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './quick-test.html',
  styleUrl: './quick-test.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickTest implements OnInit, OnDestroy {
  @Output() readonly testSaved = new EventEmitter<{
    title: string;
    subjects: string[];
    chapters: string[];
    questionCount: number;
    duration: number;
  }>();

  private readonly storageKey = 'activeQuickTest';
  private readonly pendingResultKey = 'pendingQuickTestResult';
  private timerId: ReturnType<typeof setInterval> | null = null;
  private questionEnteredAt = Date.now();

  readonly view = signal<QuickTestView>('wizard');
  readonly step = signal<WizardStep>(1);
  readonly testName = signal<string>('NEET Custom Practice Test');
  readonly subjects = signal<string[]>([]);
  readonly chapters = signal<string[]>([]);
  readonly selectedSubjects = signal<string[]>([]);
  readonly selectedChapters = signal<string[]>([]);
  readonly topicCount = signal(0);
  readonly questionCount = signal(15);
  readonly duration = signal(15);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly activeSession = signal<ActiveTestSession | null>(null);
  readonly currentQuestionIndex = signal(0);
  readonly questionStates = signal<TestQuestionState[]>([]);
  readonly remainingSeconds = signal(0);
  readonly submitResponse = signal<SubmitTestResponse | null>(null);
  readonly testResult = signal<TestResult | null>(null);
  readonly resultFilter = signal<ResultFilter>('all');
  readonly isLoadingResult = signal(false);
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

  readonly questionCountOptions = [15, 20, 25, 30, 35, 40];
  readonly optionKeys: TestOption[] = ['A', 'B', 'C', 'D'];

  readonly currentQuestion = computed<TestQuestion | null>(() => {
    const session = this.activeSession();
    return session?.questions[this.currentQuestionIndex()] ?? null;
  });

  readonly currentQuestionState = computed<TestQuestionState | null>(() =>
    this.questionStates()[this.currentQuestionIndex()] ?? null
  );

  readonly answeredCount = computed(() =>
    this.questionStates().filter((state) => state.selectedOption !== null).length
  );

  readonly markedCount = computed(() =>
    this.questionStates().filter((state) => state.markedForReview).length
  );

  readonly visitedCount = computed(() =>
    this.questionStates().filter((state) => state.visited).length
  );

  readonly formattedTime = computed(() => {
    const seconds = this.remainingSeconds();
    const minutesPart = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secondsPart = (seconds % 60).toString().padStart(2, '0');
    return `${minutesPart}:${secondsPart}`;
  });

  readonly filteredReview = computed(() => {
    const review = this.testResult()?.review ?? [];
    switch (this.resultFilter()) {
      case 'correct':
        return review.filter((question) => question.is_correct);
      case 'wrong':
        return review.filter(
          (question) => !question.is_correct && !question.is_skipped
        );
      case 'skipped':
        return review.filter((question) => question.is_skipped);
      default:
        return review;
    }
  });

  readonly wrongQuestions = computed(() =>
    (this.testResult()?.review ?? []).filter(
      (question) => !question.is_correct && !question.is_skipped
    )
  );

  constructor(private readonly quickTestService: QuickTestService) {}

  readonly trackByValue = (_index: number, value: string | number): string | number => value;
  readonly trackByQuestion = (_index: number, question: TestQuestion): number => question.id;
  readonly trackByMessage = (_index: number, message: ChatMessage): string => message._id;
  readonly trackByReview = (_index: number, question: TestResultQuestion): number => question.id;

  ngOnInit(): void {
    const pendingResultSessionId = sessionStorage.getItem(this.pendingResultKey);
    if (pendingResultSessionId) {
      this.view.set('result');
      this.loadResult(pendingResultSessionId);
      return;
    }

    if (!this.restoreSession()) {
      this.loadSubjects();
    }
  }

  ngOnDestroy(): void {
    this.recordCurrentQuestionTime();
    this.persistSession();
    this.stopTimer();
  }

  loadSubjects(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.quickTestService.getSubjects().subscribe({
      next: (response) => {
        this.subjects.set(response.data ?? []);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(this.getErrorMessage(error, 'Unable to load subjects.'));
        this.isLoading.set(false);
      }
    });
  }

  toggleSubject(subject: string): void {
    this.selectedSubjects.update((selected) =>
      selected.includes(subject)
        ? selected.filter((item) => item !== subject)
        : [...selected, subject]
    );
  }

  toggleChapter(chapter: string): void {
    this.selectedChapters.update((selected) =>
      selected.includes(chapter)
        ? selected.filter((item) => item !== chapter)
        : [...selected, chapter]
    );
  }

  toggleAllChapters(): void {
    if (this.selectedChapters().length === this.chapters().length) {
      this.selectedChapters.set([]);
      return;
    }

    this.selectedChapters.set([...this.chapters()]);
  }

  goToSubjects(): void {
    if (!this.testName().trim()) {
      return;
    }
    this.step.set(2);
  }

  goToChapters(): void {
    if (this.selectedSubjects().length === 0) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.selectedChapters.set([]);

    this.quickTestService.getChapters({
      subjects: this.selectedSubjects()
    }).subscribe({
      next: (response) => {
        const chapterNames = response.data
          .map((item) => item.chapter?.trim())
          .filter((chapter): chapter is string => Boolean(chapter));

        this.chapters.set([...new Set(chapterNames)].sort());
        this.step.set(3);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(this.getErrorMessage(error, 'Unable to load chapters.'));
        this.isLoading.set(false);
      }
    });
  }

  goToConfiguration(): void {
    if (this.selectedChapters().length === 0) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.quickTestService.getTopics({
      subjects: this.selectedSubjects(),
      chapters: this.selectedChapters()
    }).subscribe({
      next: (response) => {
        this.topicCount.set(response.total ?? response.data.length);
        this.step.set(4);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(this.getErrorMessage(error, 'Unable to load topics.'));
        this.isLoading.set(false);
      }
    });
  }

  previousStep(): void {
    this.errorMessage.set(null);
    if (this.step() === 4) {
      this.step.set(3);
    } else if (this.step() === 3) {
      this.step.set(2);
    } else if (this.step() === 2) {
      this.step.set(1);
    }
  }

  setQuestionCount(count: number): void {
    this.questionCount.set(count);
  }

  setDuration(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.duration.set(Number(input.value));
  }

  saveTest(): void {
    if (
      !this.testName().trim() ||
      this.selectedSubjects().length === 0 ||
      this.selectedChapters().length === 0 ||
      this.isLoading()
    ) {
      return;
    }

    this.testSaved.emit({
      title: this.testName().trim(),
      subjects: this.selectedSubjects(),
      chapters: this.selectedChapters(),
      questionCount: this.questionCount(),
      duration: this.duration()
    });
  }

  startTest(): void {
    if (
      this.selectedSubjects().length === 0 ||
      this.selectedChapters().length === 0 ||
      this.isLoading()
    ) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.quickTestService.startTest({
      subjects: this.selectedSubjects(),
      chapters: this.selectedChapters(),
      questionCount: this.questionCount(),
      duration: this.duration()
    }).subscribe({
      next: (response) => {
        if (!response.sessionId || !response.data?.length) {
          this.errorMessage.set('The test was created without any questions.');
          this.isLoading.set(false);
          return;
        }

        this.createSession(response);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(this.getErrorMessage(error, 'Unable to start the test.'));
        this.isLoading.set(false);
      }
    });
  }

  selectOption(option: TestOption): void {
    if (this.isSubmitting()) {
      return;
    }

    this.updateCurrentState({ selectedOption: option });
  }

  clearResponse(): void {
    this.updateCurrentState({ selectedOption: null });
  }

  toggleMarkForReview(): void {
    const state = this.currentQuestionState();
    if (state) {
      this.updateCurrentState({ markedForReview: !state.markedForReview });
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

  nextQuestion(): void {
    this.goToQuestion(this.currentQuestionIndex() + 1);
  }

  previousQuestion(): void {
    this.goToQuestion(this.currentQuestionIndex() - 1);
  }

  requestSubmit(): void {
    const unanswered = this.questionStates().length - this.answeredCount();
    const message = unanswered > 0
      ? `${unanswered} question(s) are unanswered. Submit the test anyway?`
      : 'Submit your test now?';

    if (window.confirm(message)) {
      this.submitTest(false);
    }
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

    this.quickTestService.submitTest({
      sessionId: session.sessionId,
      answers
    }).subscribe({
      next: (response) => {
        sessionStorage.removeItem(this.storageKey);
        sessionStorage.setItem(this.pendingResultKey, session.sessionId);
        this.submitResponse.set(response);
        this.view.set('result');
        this.isSubmitting.set(false);
        this.loadResult(session.sessionId);
      },
      error: (error) => {
        this.errorMessage.set(
          this.getErrorMessage(
            error,
            automatic
              ? 'Time is up, but submission failed. Please retry.'
              : 'Unable to submit the test. Your answers are saved.'
          )
        );
        this.isSubmitting.set(false);
        this.persistSession();
      }
    });
  }

  retrySubmission(): void {
    this.submitTest(true);
  }

  loadResult(sessionId?: string): void {
    const resolvedSessionId =
      sessionId ??
      this.activeSession()?.sessionId ??
      sessionStorage.getItem(this.pendingResultKey);

    if (!resolvedSessionId || this.isLoadingResult()) {
      return;
    }

    this.isLoadingResult.set(true);
    this.errorMessage.set(null);

    this.quickTestService.getTestResult(resolvedSessionId).subscribe({
      next: (response) => {
        this.testResult.set(response.data);
        this.resultFilter.set('all');
        this.isLoadingResult.set(false);
        sessionStorage.removeItem(this.pendingResultKey);
      },
      error: (error) => {
        this.errorMessage.set(
          this.getErrorMessage(error, 'Unable to load the test result.')
        );
        this.isLoadingResult.set(false);
      }
    });
  }

  setResultFilter(filter: ResultFilter): void {
    this.resultFilter.set(filter);
  }

  reviewOptionClass(
    question: TestResultQuestion,
    option: TestOption
  ): string {
    if (option === question.correct_answer) {
      return 'correct-option';
    }
    if (option === question.selected_option && !question.is_correct) {
      return 'wrong-option';
    }
    if (option === question.selected_option) {
      return 'selected-option';
    }
    return '';
  }

  resultStatus(question: TestResultQuestion): string {
    if (question.is_skipped) {
      return 'Skipped';
    }
    return question.is_correct ? 'Correct' : 'Wrong';
  }

  formatDuration(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }

  openChat(questionId?: number): void {
    const result = this.testResult();
    if (!result || result.wrong === 0) {
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
    this.ensureChatSession(result.sessionId).subscribe({
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
    const result = this.testResult();
    if (!result || result.wrong === 0 || this.isLoadingInsights()) {
      return;
    }

    this.aiPanel.set('insights');
    this.insightsError.set(null);

    if (this.zoneInsight()) {
      return;
    }

    this.isLoadingInsights.set(true);
    this.quickTestService.getZoneInsights(result.sessionId).subscribe({
      next: (response) => {
        this.zoneInsight.set(response.data);
        this.isLoadingInsights.set(false);
      },
      error: (error) => {
        if (error?.status === 404) {
          this.generateAndLoadInsights(result.sessionId);
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

  optionText(question: TestQuestion, option: TestOption): string {
    const key = `option_${option.toLowerCase()}` as
      'option_a' | 'option_b' | 'option_c' | 'option_d';
    return String(question[key]);
  }

  insightSubjects(data: Record<string, string[]>): string[] {
    return Object.keys(data);
  }

  private createSession(response: StartTestResponse): void {
    const startedAt = Date.now();
    const durationSeconds = response.duration * 60;
    const states = response.data.map((question, index) => ({
      questionId: question.id,
      selectedOption: null,
      timeSpent: 0,
      markedForReview: false,
      visited: index === 0
    } satisfies TestQuestionState));

    const session: ActiveTestSession = {
      sessionId: response.sessionId,
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
    this.persistSession();
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
          title: 'My NEET Test Review'
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

  private restoreSession(): boolean {
    const stored = sessionStorage.getItem(this.storageKey);
    if (!stored) {
      return false;
    }

    try {
      const session = JSON.parse(stored) as ActiveTestSession;
      if (
        !session.sessionId ||
        !Array.isArray(session.questions) ||
        !Array.isArray(session.questionStates) ||
        session.questions.length === 0
      ) {
        sessionStorage.removeItem(this.storageKey);
        return false;
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
        this.submitTest(true);
      } else {
        this.startTimer();
      }

      return true;
    } catch {
      sessionStorage.removeItem(this.storageKey);
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

    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - this.questionEnteredAt) / 1000)
    );
    if (elapsedSeconds > 0) {
      const state = this.currentQuestionState();
      if (state) {
        this.updateCurrentState({
          timeSpent: state.timeSpent + elapsedSeconds
        });
      }
      this.questionEnteredAt = Date.now();
    }
  }

  private updateCurrentState(
    changes: Partial<Omit<TestQuestionState, 'questionId'>>
  ): void {
    const index = this.currentQuestionIndex();
    this.questionStates.update((states) =>
      states.map((state, stateIndex) =>
        stateIndex === index ? { ...state, ...changes } : state
      )
    );
    this.persistSession();
  }

  private persistSession(): void {
    const session = this.activeSession();
    if (!session || this.view() === 'result') {
      return;
    }

    const storedSession: ActiveTestSession = {
      ...session,
      questionStates: this.questionStates(),
      currentQuestionIndex: this.currentQuestionIndex()
    };
    sessionStorage.setItem(this.storageKey, JSON.stringify(storedSession));
  }

  private getErrorMessage(error: any, fallback: string): string {
    return error?.error?.message ?? error?.message ?? fallback;
  }
}
