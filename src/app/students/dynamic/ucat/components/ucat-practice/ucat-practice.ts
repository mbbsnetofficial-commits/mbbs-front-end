import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  UcatActiveSession,
  UcatChapter,
  UcatHistoryItem,
  UcatOption,
  UcatQuestion,
  UcatQuestionState,
  UcatResultQuestion,
  UcatSaveAnswerRequest,
  UcatTestMode,
  UcatTestResult,
  UcatTopic
} from '../../models/ucat.model';
import { UcatService } from '../../services/ucat.service';
import { UcatStreakService } from '../../services/ucat-streak.service';
import { UcatStreakData } from '../../models/ucat-streak.model';

type UcatViewMode = 'wizard' | 'test' | 'result' | 'history';
type WizardStep = 1 | 2 | 3 | 4;
type ResultFilter = 'all' | 'correct' | 'wrong' | 'skipped';

@Component({
  selector: 'app-ucat-practice',
  standalone: true,
  imports: [CommonModule],
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

  readonly progressPercentage = computed(() => {
    const total = this.questionStates().length;
    if (!total || total <= 0) return 0;
    const answered = this.answeredCount();
    const pct = Math.round((answered / total) * 100);
    return Math.max(0, Math.min(100, isNaN(pct) ? 0 : pct));
  });

  readonly formattedRemainingTime = computed(() => {
    const totalSec = this.remainingSeconds();
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  readonly allReviewQuestions = computed<UcatResultQuestion[]>(() => {
    const result = this.testResult();
    if (!result) return [];
    return (result as any).questions || result.review || [];
  });

  readonly resultTestTitle = computed<string>(() => {
    const session = this.activeSession();
    if (session?.test_type) return session.test_type;
    const res = this.testResult();
    if (res?.test_type) return res.test_type;
    const subjects = this.selectedSubjects();
    if (subjects.length > 0) return subjects.join(', ') + ' Test';
    return this.testMode() === 'QUICK_TEST' ? 'Quick Test' : 'Custom Practice Test';
  });

  readonly filteredReview = computed<UcatResultQuestion[]>(() => {
    const reviews = this.allReviewQuestions();
    const filter = this.resultFilter();

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

  constructor(
    private readonly ucatService: UcatService,
    private readonly ucatStreakService: UcatStreakService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (this.restoreActiveSession()) {
      return;
    }
    this.loadSubjects();
    this.loadStreak();
  }

  private restoreActiveSession(): boolean {
    try {
      const raw = sessionStorage.getItem('activeUcatPracticeTest');
      if (!raw) return false;
      const session: UcatActiveSession = JSON.parse(raw);
      if (session && session.sessionId && session.questions?.length) {
        this.activeSession.set(session);
        this.currentQuestionIndex.set(session.currentQuestionIndex || 0);
        this.questionStates.set(session.questionStates || []);
        const durationMins = session.durationMinutes || 15;
        this.remainingSeconds.set(durationMins * 60);
        this.view.set('test');
        this.startMainTimer();
        this.startQuestionTimer();
        return true;
      }
    } catch {}
    return false;
  }

  private persistSessionState(): void {
    const session = this.activeSession();
    if (!session) return;
    try {
      const updatedSession: UcatActiveSession = {
        ...session,
        questionStates: this.questionStates(),
        currentQuestionIndex: this.currentQuestionIndex()
      };
      sessionStorage.setItem('activeUcatPracticeTest', JSON.stringify(updatedSession));
    } catch {}
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

  onStartTest(): void {
    if (this.selectedSubjects().length === 0) {
      this.errorMessage.set('Please select at least one subject to start the test.');
      return;
    }

    if (this.selectedChapters().length === 0) {
      this.errorMessage.set('Please select at least one chapter to start the test.');
      return;
    }

    const rawTopicIds = this.testMode() === 'QUICK_TEST' ? [] : this.selectedTopicIds();
    const topicIds = rawTopicIds.map((id) =>
      typeof id === 'number' ? id : (!isNaN(Number(id)) ? Number(id) : id)
    );

    this.isStartingTest.set(true);
    this.errorMessage.set(null);

    const payload = {
      subjects: this.selectedSubjects(),
      chapters: this.selectedChapters(),
      topic_ids: topicIds,
      limit: Number(this.questionLimit() || 20),
      duration: Number(this.testDuration() || 15)
    };

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
      const newOption = states[idx].selectedOption === option ? null : option;
      states[idx] = {
        ...states[idx],
        selectedOption: newOption,
        visited: true
      };
      this.questionStates.set(states);
      this.persistSessionState();

      const session = this.activeSession();
      if (session?.sessionId) {
        this.autosaveAnswer(
          session.sessionId,
          states[idx].questionId,
          newOption,
          states[idx].timeSpent
        );
      }
    }
    this.startQuestionTimer();
  }

  private autosaveAnswer(
    sessionId: string,
    questionId: number | string,
    selectedOption: UcatOption | string | null,
    timeSpent: number
  ): void {
    const payload: UcatSaveAnswerRequest = {
      question_id: typeof questionId === 'string' && !isNaN(Number(questionId)) ? Number(questionId) : questionId,
      selected_option: selectedOption,
      time_spent: timeSpent
    };

    this.ucatService.saveAnswer(sessionId, payload).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  jumpToQuestion(index: number): void {
    if (index < 0 || index >= this.questionStates().length) return;
    this.saveCurrentQuestionTime();

    const states = [...this.questionStates()];
    if (states[index]) {
      states[index] = { ...states[index], visited: true };
      this.questionStates.set(states);
      this.persistSessionState();
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

  skipQuestion(): void {
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
    if (this.isSubmittingTest()) return;
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
        try {
          sessionStorage.removeItem('activeUcatPracticeTest');
        } catch {}
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

  setResultFilter(filter: ResultFilter): void {
    this.resultFilter.set(filter);
  }

  backToLearningReport(): void {
    this.clearTimers();
    this.view.set('wizard');
    void this.router.navigate(['/dynamic/ucat']);
  }

  formatSeconds(seconds?: number): string {
    if (!seconds && seconds !== 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  }

  reviewOptionClass(item: UcatResultQuestion, key: UcatOption): { [key: string]: boolean } {
    const isCorrect = item.correct_answer === key;
    const isUserChoice = (item.selected || item.selected_option) === key;
    const isWrong = isUserChoice && !(item.isCorrect || item.is_correct);
    return {
      'correct-option': isCorrect,
      'wrong-option': isWrong
    };
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
