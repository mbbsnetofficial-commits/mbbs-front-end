import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  UcatActiveSession,
  UcatChapter,
  UcatHistoryItem,
  UcatOption,
  UcatQuestion,
  UcatQuestionState,
  UcatResultQuestion,
  UcatTestMode,
  UcatTestResult,
  UcatTopic
} from '../../models/ucat.model';
import { UcatService } from '../../services/ucat.service';
import { UcatStreakService } from '../../services/ucat-streak.service';
import { UcatStreakData } from '../../models/ucat-streak.model';
import { UcatChatService } from '../../services/ucat-chat.service';
import { UcatAiChatModal } from '../../components/ucat-ai-chat-modal/ucat-ai-chat-modal';
import { UcatAiInsightsModal } from '../../components/ucat-ai-insights-modal/ucat-ai-insights-modal';
import { TokenService } from '../../../../core/serivce/token.service';

type UcatViewMode = 'wizard' | 'test' | 'result' | 'history';
type WizardStep = 1 | 2 | 3 | 4;
type ResultFilter = 'all' | 'correct' | 'wrong' | 'skipped';

@Component({
  selector: 'app-ucat-practice',
  standalone: true,
  imports: [CommonModule, UcatAiChatModal, UcatAiInsightsModal],
  templateUrl: './ucat-practice.html',
  styleUrl: './ucat-practice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UcatPractice implements OnInit, OnDestroy {
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private currentQuestionTimeSpent = 0;
  private questionTimerInterval: ReturnType<typeof setInterval> | null = null;

  // Primary Navigation Tabs
  readonly view = signal<UcatViewMode>('wizard');
  readonly testMode = signal<UcatTestMode>('CUSTOM_TEST');

  // Wizard state
  readonly wizardStep = signal<WizardStep>(1);
  readonly subjects = signal<string[]>([]);
  readonly chapters = signal<UcatChapter[]>([]);
  readonly topics = signal<UcatTopic[]>([]);

  readonly selectedSubjects = signal<string[]>([]);
  readonly selectedChapters = signal<string[]>([]);
  readonly selectedTopicIds = signal<(number | string)[]>([]);

  // Configuration
  readonly questionLimit = signal<number>(20);
  readonly testDuration = signal<number>(15);
  readonly limitOptions = [10, 15, 20, 25, 30];
  readonly durationOptions = [10, 15, 20, 30, 45, 60];

  // Loading & error signals
  readonly isLoadingSubjects = signal(false);
  readonly isLoadingChapters = signal(false);
  readonly isLoadingTopics = signal(false);
  readonly isStartingTest = signal(false);
  readonly isSubmittingTest = signal(false);
  readonly isLoadingResult = signal(false);
  readonly isLoadingHistory = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Active Test Runner state
  readonly activeSession = signal<UcatActiveSession | null>(null);
  readonly currentQuestionIndex = signal(0);
  readonly questionStates = signal<UcatQuestionState[]>([]);
  readonly remainingSeconds = signal(0);
  readonly showReviewModal = signal(false);

  // Result state
  readonly testResult = signal<UcatTestResult | null>(null);
  readonly resultFilter = signal<ResultFilter>('all');

  // History state
  readonly historyItems = signal<UcatHistoryItem[]>([]);
  readonly historyPage = signal(1);
  readonly historyLimit = signal(20);
  readonly historyTotalPages = signal(1);
  readonly historyTotal = signal(0);

  readonly optionKeys: UcatOption[] = ['A', 'B', 'C', 'D'];

  // Computeds
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
    const reviews: UcatResultQuestion[] = (result as any).questions || result.review || [];

    if (filter === 'all') return reviews;
    if (filter === 'correct') return reviews.filter((r) => r.isCorrect || r.is_correct);
    if (filter === 'wrong')
      return reviews.filter(
        (r) =>
          !(r.isCorrect || r.is_correct) &&
          !r.is_skipped &&
          (r.selected || r.selected_option)
      );
    if (filter === 'skipped')
      return reviews.filter(
        (r) =>
          r.is_skipped ||
          (!r.selected && !r.selected_option)
      );

    return reviews;
  });

  readonly streakData = signal<UcatStreakData | null>(null);
  readonly activeChatSessionId = signal<string | null>(null);
  readonly showAiChatModal = signal<boolean>(false);
  readonly showAiInsightsModal = signal<boolean>(false);
  readonly isOpeningChat = signal<boolean>(false);

  constructor(
    private readonly ucatService: UcatService,
    private readonly ucatStreakService: UcatStreakService,
    private readonly ucatChatService: UcatChatService,
    private readonly tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.loadSubjects();
    this.loadStreak();
  }

  openAiChatForTestSession(testSessionId: string, defaultTitle = 'UCAT Test Review'): void {
    if (!testSessionId || this.isOpeningChat()) return;

    this.isOpeningChat.set(true);
    this.errorMessage.set(null);

    this.ucatChatService.getChatSessions().subscribe({
      next: (res) => {
        const existing = res.data?.find((s) => s.testSessionId === testSessionId);
        if (existing && existing.chatSessionId) {
          this.isOpeningChat.set(false);
          this.activeChatSessionId.set(existing.chatSessionId);
          this.showAiChatModal.set(true);
        } else {
          this.ucatChatService.createChatSession(testSessionId, defaultTitle).subscribe({
            next: (createRes) => {
              this.isOpeningChat.set(false);
              if (createRes && createRes.data && createRes.data.chatSessionId) {
                this.activeChatSessionId.set(createRes.data.chatSessionId);
                this.showAiChatModal.set(true);
              }
            },
            error: (err) => {
              this.isOpeningChat.set(false);
              const msg = err?.error?.message || err?.message || 'Failed to initialize AI Review Chat.';
              this.errorMessage.set(msg);
            }
          });
        }
      },
      error: (err) => {
        this.isOpeningChat.set(false);
        const msg = err?.error?.message || err?.message || 'Failed to verify AI Review Chat sessions.';
        this.errorMessage.set(msg);
      }
    });
  }

  closeAiChatModal(): void {
    this.showAiChatModal.set(false);
  }

  openAiInsightsForTestSession(): void {
    this.showAiInsightsModal.set(true);
  }

  closeAiInsightsModal(): void {
    this.showAiInsightsModal.set(false);
  }

  onTransitionToAiChatFromInsights(testSessionId: string): void {
    this.closeAiInsightsModal();
    this.openAiChatForTestSession(testSessionId);
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

  // Navigation tabs
  switchMainView(targetView: UcatViewMode): void {
    if (targetView === 'history') {
      this.loadHistory(1);
    }
    this.view.set(targetView);
  }

  setTestMode(mode: UcatTestMode): void {
    this.testMode.set(mode);
    if (mode === 'QUICK_TEST' && this.wizardStep() === 3) {
      this.wizardStep.set(4);
    }
  }

  // --- Step 1: Subjects ---
  loadSubjects(): void {
    this.isLoadingSubjects.set(true);
    this.errorMessage.set(null);

    this.ucatService.getSubjects().subscribe({
      next: (res) => {
        this.isLoadingSubjects.set(false);
        if (res && res.data) {
          this.subjects.set(res.data);
        }
      },
      error: () => {
        this.isLoadingSubjects.set(false);
        this.errorMessage.set('Failed to load UCAT subjects.');
      }
    });
  }

  toggleSubject(subject: string): void {
    const current = this.selectedSubjects();
    const updated = current.includes(subject)
      ? current.filter((s) => s !== subject)
      : [...current, subject];

    this.selectedSubjects.set(updated);
    this.selectedChapters.set([]);
    this.chapters.set([]);
    this.selectedTopicIds.set([]);
    this.topics.set([]);
  }

  selectAllSubjects(): void {
    const all = [...this.subjects()];
    this.selectedSubjects.set(all);
    this.selectedChapters.set([]);
    this.chapters.set([]);
    this.selectedTopicIds.set([]);
    this.topics.set([]);
  }

  clearSubjects(): void {
    this.selectedSubjects.set([]);
    this.selectedChapters.set([]);
    this.chapters.set([]);
    this.selectedTopicIds.set([]);
    this.topics.set([]);
  }

  // --- Step 2: Chapters ---
  loadChapters(subjects: string[]): void {
    this.isLoadingChapters.set(true);
    this.errorMessage.set(null);

    this.ucatService.getChapters({ subjects }).subscribe({
      next: (res) => {
        this.isLoadingChapters.set(false);
        if (res && res.data) {
          this.chapters.set(res.data);
        }
      },
      error: () => {
        this.isLoadingChapters.set(false);
        this.errorMessage.set('Failed to load chapters.');
      }
    });
  }

  toggleChapter(chapterName: string): void {
    const current = this.selectedChapters();
    const updated = current.includes(chapterName)
      ? current.filter((c) => c !== chapterName)
      : [...current, chapterName];

    this.selectedChapters.set(updated);
    this.selectedTopicIds.set([]);
    this.topics.set([]);
  }

  selectAllChapters(): void {
    const allNames = this.chapters().map((c) => c.chapter);
    this.selectedChapters.set(allNames);
    this.selectedTopicIds.set([]);
    this.topics.set([]);
  }

  clearChapters(): void {
    this.selectedChapters.set([]);
    this.selectedTopicIds.set([]);
    this.topics.set([]);
  }

  // --- Step 3: Topics ---
  loadTopics(subjects: string[], chapters: string[]): void {
    this.isLoadingTopics.set(true);
    this.errorMessage.set(null);

    this.ucatService.getTopics({ subjects, chapters }).subscribe({
      next: (res) => {
        this.isLoadingTopics.set(false);
        if (res && res.data) {
          this.topics.set(res.data);
        }
      },
      error: () => {
        this.isLoadingTopics.set(false);
        this.errorMessage.set('Failed to load topics.');
      }
    });
  }

  toggleTopic(topic: UcatTopic): void {
    const topicId = topic.id ?? topic._id;
    if (topicId === undefined) return;

    const current = this.selectedTopicIds();
    this.selectedTopicIds.set(
      current.includes(topicId)
        ? current.filter((id) => id !== topicId)
        : [...current, topicId]
    );
  }

  isTopicSelected(topic: UcatTopic): boolean {
    const topicId = topic.id ?? topic._id;
    if (topicId === undefined) return false;
    return this.selectedTopicIds().includes(topicId);
  }

  selectAllTopics(): void {
    const allIds = this.topics()
      .map((t) => t.id ?? t._id)
      .filter((id): id is string | number => id !== undefined);
    this.selectedTopicIds.set(allIds);
  }

  clearTopics(): void {
    this.selectedTopicIds.set([]);
  }

  goToStep(step: WizardStep): void {
    if (step === 2) {
      if (this.selectedSubjects().length === 0) return;
      this.loadChapters(this.selectedSubjects());
      this.wizardStep.set(2);
      return;
    }

    if (step === 3) {
      if (this.testMode() === 'QUICK_TEST') {
        this.wizardStep.set(4);
        return;
      }
      if (this.selectedChapters().length === 0) return;
      this.loadTopics(this.selectedSubjects(), this.selectedChapters());
      this.wizardStep.set(3);
      return;
    }

    if (step === 4) {
      if (this.testMode() === 'CUSTOM_TEST' && this.selectedTopicIds().length === 0) return;
      if (this.selectedChapters().length === 0) return;
      this.wizardStep.set(4);
      return;
    }

    this.wizardStep.set(step);
  }

  // --- Step 4: Start Test ---
  private resolveStudentId(): string | null {
    // Use UcatService which decodes JWT and reads from storage
    return this.ucatService.getStudentIdFromToken()
      ?? this.tokenService.getStudentId();
  }

  onStartTest(): void {
    const studentId = this.resolveStudentId();

    if (!studentId) {
      this.errorMessage.set('Student session not found. Please log out and log in again.');
      return;
    }

    const subjects = this.selectedSubjects().length > 0
      ? this.selectedSubjects()
      : ['DECISION_MAKING', 'VERBAL_REASONING'];

    const chapters = this.selectedChapters().length > 0
      ? this.selectedChapters()
      : (this.chapters().length > 0 ? this.chapters().map(c => c.chapter) : ['Reading Comprehension & Inference']);

    const rawTopicIds = this.testMode() === 'QUICK_TEST' ? [] : this.selectedTopicIds();
    const topicIds = rawTopicIds.map((id) =>
      typeof id === 'number' ? id : (!isNaN(Number(id)) ? Number(id) : id)
    );

    this.isStartingTest.set(true);
    this.errorMessage.set(null);

    const payload = {
      student_id: studentId,
      subjects,
      chapters,
      topic_ids: topicIds,
      limit: Number(this.questionLimit() || 20),
      duration: Number(this.testDuration() || 15)
    };

    console.log('[UCAT] Start test payload:', payload);

    this.ucatService.startTest(payload).subscribe({
      next: (res) => {
        this.isStartingTest.set(false);
        const sessionData = (res as any)?.data || res;
        if (sessionData && (sessionData.sessionId || sessionData.questions)) {
          const questions: UcatQuestion[] = sessionData.questions || (Array.isArray(sessionData) ? sessionData : []);
          if (!questions.length) {
            this.errorMessage.set('No questions returned for selected criteria.');
            return;
          }

          const durationMins = sessionData.duration || payload.duration;
          const initialStates: UcatQuestionState[] = questions.map((q, idx) => {
            const qId = q.question_id ?? q.id ?? q._id ?? idx;
            const existingAns = sessionData.answers?.find((a: any) => a.question_id === qId);
            return {
              questionId: qId,
              selectedOption: (existingAns?.selected_option as UcatOption) || null,
              timeSpent: existingAns?.time_spent || 0,
              visited: idx === 0
            };
          });

          this.activeSession.set({
            sessionId: sessionData.sessionId,
            durationMinutes: durationMins,
            totalQuestions: questions.length,
            questions,
            questionStates: initialStates,
            currentQuestionIndex: 0,
            startedAtTimestamp: Date.now(),
            test_type: sessionData.test_type || this.testMode()
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
        const serverError = err?.error?.message || err?.message || 'Error starting test. Please try again.';
        this.errorMessage.set(serverError);
      }
    });
  }

  // --- Test Runner Operations ---
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
        question_id: typeof st.questionId === 'string' && !isNaN(Number(st.questionId)) ? Number(st.questionId) : st.questionId,
        selected_option: String(st.selectedOption),
        time_spent: Number(st.timeSpent || 0)
      }));

    const payload = {
      sessionId: session.sessionId,
      answers
    };

    this.ucatService.submitTest(payload).subscribe({
      next: () => {
        this.isSubmittingTest.set(false);
        // Record streak after test submission succeeds
        this.ucatStreakService.recordStreak('PRACTICE_TEST').subscribe({
          next: (res) => {
            if (res && res.data) {
              this.streakData.set(res.data);
            }
          }
        });
        // CRITICAL RESULT FLOW: Call Result API as the single source of truth!
        this.fetchResultAndDisplay(session.sessionId);
      },
      error: (err) => {
        this.isSubmittingTest.set(false);
        const msg = err?.error?.message || err?.message || 'Submission failed. Please try again.';
        this.errorMessage.set(msg);
      }
    });
  }

  // Single Source of Truth Result Fetching
  fetchResultAndDisplay(sessionId: string): void {
    this.isLoadingResult.set(true);
    this.errorMessage.set(null);

    this.ucatService.getTestResult(sessionId).subscribe({
      next: (res) => {
        this.isLoadingResult.set(false);
        const resultObj: UcatTestResult =
          (res as any)?.data?.sessionId || (res as any)?.sessionId
            ? ((res as any)?.data || res)
            : (res as any)?.data || (res as any);

        this.testResult.set(resultObj);
        this.view.set('result');
      },
      error: () => {
        this.isLoadingResult.set(false);
        this.errorMessage.set('Failed to load test result details.');
      }
    });
  }

  // --- History & Session Restoration ---
  loadHistory(page = 1): void {
    this.isLoadingHistory.set(true);
    this.errorMessage.set(null);

    this.ucatService.getHistory(page, this.historyLimit()).subscribe({
      next: (res) => {
        this.isLoadingHistory.set(false);
        if (res) {
          const dataObj: any = res.data || res;
          const sessions: UcatHistoryItem[] =
            dataObj.sessions ||
            (Array.isArray(dataObj) ? dataObj : dataObj.data || []);
          this.historyItems.set(sessions);

          const currentPage = dataObj.page || res.page || page;
          const totalCount = dataObj.total ?? res.total ?? sessions.length;
          const limitCount = dataObj.limit || res.limit || this.historyLimit();
          const totalPagesCount =
            dataObj.totalPages ||
            res.totalPages ||
            Math.ceil(totalCount / limitCount) ||
            1;

          this.historyPage.set(currentPage);
          this.historyTotal.set(totalCount);
          this.historyTotalPages.set(totalPagesCount);
        }
      },
      error: () => {
        this.isLoadingHistory.set(false);
        this.errorMessage.set('Failed to load test history.');
      }
    });
  }

  changeHistoryPage(newPage: number): void {
    if (newPage < 1 || newPage > this.historyTotalPages()) return;
    this.loadHistory(newPage);
  }

  viewResultFromHistory(sessionId: string): void {
    this.fetchResultAndDisplay(sessionId);
  }

  resumeTestFromHistory(sessionId: string): void {
    this.isLoadingHistory.set(true);
    this.errorMessage.set(null);

    this.ucatService.getTestSession(sessionId).subscribe({
      next: (res) => {
        this.isLoadingHistory.set(false);
        if (res) {
          const questions = res.questions || res.data || [];
          const durationMins = res.duration || 15;
          const initialStates: UcatQuestionState[] = questions.map((q, idx) => {
            const qId = q.question_id ?? q.id ?? q._id ?? idx;
            const existingAns = res.answers?.find((a) => a.question_id === qId);
            return {
              questionId: qId,
              selectedOption: (existingAns?.selected_option as UcatOption) || null,
              timeSpent: existingAns?.time_spent || 0,
              visited: idx === 0
            };
          });

          this.activeSession.set({
            sessionId: res.sessionId || sessionId,
            durationMinutes: durationMins,
            totalQuestions: questions.length,
            questions,
            questionStates: initialStates,
            currentQuestionIndex: 0,
            startedAtTimestamp: Date.now()
          });

          this.currentQuestionIndex.set(0);
          this.questionStates.set(initialStates);
          this.remainingSeconds.set(durationMins * 60);

          this.view.set('test');
          this.startMainTimer();
          this.startQuestionTimer();
        }
      },
      error: () => {
        this.isLoadingHistory.set(false);
        this.errorMessage.set('Failed to resume in-progress session.');
      }
    });
  }

  resetToWizard(): void {
    this.clearTimers();
    this.view.set('wizard');
    this.wizardStep.set(1);
    this.activeSession.set(null);
    this.testResult.set(null);
    this.errorMessage.set(null);
    this.loadSubjects();
  }

  getOptionText(question: UcatQuestion, optionKey: UcatOption): string | number {
    switch (optionKey) {
      case 'A':
        return question.option_a;
      case 'B':
        return question.option_b;
      case 'C':
        return question.option_c;
      case 'D':
        return question.option_d;
    }
  }

  getReviewOptionText(review: UcatResultQuestion, optionKey: UcatOption): string | number {
    switch (optionKey) {
      case 'A':
        return review.option_a;
      case 'B':
        return review.option_b;
      case 'C':
        return review.option_c;
      case 'D':
        return review.option_d;
    }
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
}
