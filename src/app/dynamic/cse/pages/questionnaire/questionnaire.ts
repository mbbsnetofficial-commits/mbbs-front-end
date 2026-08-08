import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ProgressStepper } from '../../components/progress-stepper/progress-stepper';
import { QuestionRenderer } from '../../components/question-renderer/question-renderer';
import { Country } from '../../models/country.model';
import { CseCountryQuestion, QuestionOptionItem } from '../../models/question.model';
import { CseService } from '../../services/cse.service';
import { CseStore } from '../../state/cse.store';

@Component({
  selector: 'app-cse-questionnaire',
  standalone: true,
  imports: [CommonModule, FormsModule, ProgressStepper, QuestionRenderer],
  templateUrl: './questionnaire.html',
  styleUrl: './questionnaire.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Questionnaire implements OnInit {
  readonly store = inject(CseStore);
  private readonly cseService = inject(CseService);
  private readonly router = inject(Router);

  // Component Signals
  readonly selectedCountry = signal<Country | null>(null);
  readonly questions = signal<CseCountryQuestion[]>([]);
  readonly answers = signal<Record<string, any>>({});
  readonly currentQuestionIndex = signal<number>(0);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  // Computations
  readonly currentQuestion = computed(() => {
    const list = this.questions();
    const idx = this.currentQuestionIndex();
    return list.length > 0 && idx < list.length ? list[idx] : null;
  });

  readonly totalQuestions = computed(() => this.questions().length);

  readonly progressPercent = computed(() => {
    const total = this.totalQuestions();
    if (total === 0) return 0;
    return Math.round(((this.currentQuestionIndex() + 1) / total) * 100);
  });

  readonly questionIndicator = computed(() => {
    const total = this.totalQuestions();
    if (total === 0) return 'QUESTION 0 OF 0';
    return `QUESTION ${this.currentQuestionIndex() + 1} OF ${total}`;
  });

  readonly isCurrentQuestionValid = computed(() => {
    const q = this.currentQuestion();
    if (!q) return false;

    const val = this.answers()[q.question_key];
    const isRequired = q.required === true;

    if (q.type === 'SINGLE_SELECT' || q.type === 'single-choice') {
      if (!isRequired && (val === undefined || val === null || val === '')) return true;
      return val !== undefined && val !== null && val !== '';
    }

    if (q.type === 'BOOLEAN') {
      if (!isRequired && (val === undefined || val === null)) return true;
      return typeof val === 'boolean';
    }

    if (q.type === 'NUMBER' || q.type === 'range') {
      if (val === undefined || val === null || val === '') {
        return !isRequired;
      }

      const num = Number(val);
      if (isNaN(num)) return false;

      if (q.validation?.min !== undefined && num < q.validation.min) {
        return false;
      }
      if (q.validation?.max !== undefined && num > q.validation.max) {
        return false;
      }
      return true;
    }

    if (q.type === 'MULTI_SELECT' || q.type === 'multi-choice') {
      if (!isRequired && (!val || (Array.isArray(val) && val.length === 0))) return true;
      return Array.isArray(val) && val.length > 0;
    }

    if (q.type === 'TEXT' || q.type === 'text') {
      if (!isRequired && (val === undefined || val === null || val === '')) return true;
      return val !== undefined && val !== null && String(val).trim() !== '';
    }

    if (q.type === 'SUBJECT_MARKS') {
      if (!val || typeof val !== 'object') {
        return !isRequired;
      }
      const subjects = ['english', 'chemistry', 'biology', 'physics', 'mathematics'];
      const min = q.validation?.min;
      const max = q.validation?.max;

      for (const sub of subjects) {
        const mark = val[sub];
        if (mark === undefined || mark === null || mark === '') {
          if (isRequired) return false;
          continue;
        }
        const num = Number(mark);
        if (isNaN(num)) return false;
        if (min !== undefined && num < min) return false;
        if (max !== undefined && num > max) return false;
      }
      return true;
    }

    // Fallback custom types
    if (!isRequired && (val === undefined || val === null || val === '')) return true;
    return val !== undefined && val !== null && val !== '';
  });

  constructor() {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras?.state) {
      const navCountry = nav.extras.state['country'] as Country | undefined;
      if (navCountry) {
        this.store.selectCountry(navCountry);
      }
    }
  }

  ngOnInit(): void {
    this.store.setStep(2);

    // Read selected country from cse.store.ts
    const storedCountry = this.store.selectedCountry();
    const navState = history.state;
    const navCountry = navState?.['country'] as Country | undefined;
    const country = storedCountry || navCountry;

    const countryId = country?.country_id || country?.id || (country as any)?._id || country?.code || navState?.['country_id'];

    // Requirement: If selected country is missing from store, redirect back to /dynamic/cse/country-selection
    if (!country || !countryId) {
      this.router.navigate(['/dynamic/cse/country-selection']);
      return;
    }

    if (country) {
      this.selectedCountry.set(country);
      this.store.selectCountry(country);
    }

    // Call ONLY POST /api/v1/cse/countries/questions
    this.fetchQuestions(countryId);
  }

  private fetchQuestions(countryId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.cseService.getCountryQuestions(countryId).subscribe({
      next: (qList) => {
        // Sort questions by order ascending
        const sorted = (qList || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        this.questions.set(sorted);
        // Requirement 5: Store returned questions in cse.store.ts
        this.store.setQuestions(sorted);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch country questions:', err);
        this.error.set('Failed to load questionnaire. Please try again.');
        this.loading.set(false);
      }
    });
  }

  protected onAnswerChange(questionKey: string, value: any): void {
    this.answers.update(prev => ({
      ...prev,
      [questionKey]: value
    }));
    this.store.setAnswer(questionKey, value);
  }

  protected onNumberInput(questionKey: string, event: Event): void {
    const valStr = (event.target as HTMLInputElement).value;
    const val = valStr === '' ? null : Number(valStr);
    this.onAnswerChange(questionKey, val);
  }

  protected prevQuestion(): void {
    if (this.currentQuestionIndex() > 0) {
      this.currentQuestionIndex.update(idx => idx - 1);
    } else {
      this.router.navigate(['/dynamic/cse/country-selection']);
    }
  }

  protected nextQuestion(): void {
    if (!this.isCurrentQuestionValid()) return;

    if (this.currentQuestionIndex() < this.questions().length - 1) {
      this.currentQuestionIndex.update(idx => idx + 1);
    } else {
      this.proceedToStudentDetails();
    }
  }

  protected onStepClick(stepNumber: number): void {
    if (stepNumber === 1) {
      this.router.navigate(['/dynamic/cse/country-selection']);
    } else if (stepNumber === 3 && this.isCurrentQuestionValid()) {
      this.proceedToStudentDetails();
    }
  }

  protected proceedToStudentDetails(): void {
    this.store.setStep(3);
    this.router.navigate(['/dynamic/cse/student-details'], {
      state: {
        country: this.selectedCountry(),
        country_id: this.selectedCountry()?.country_id || this.selectedCountry()?.id,
        answers: this.answers()
      }
    });
  }

  protected getOptionLabel(opt: QuestionOptionItem | string): string {
    return typeof opt === 'string' ? opt : opt.label;
  }

  protected getOptionValue(opt: QuestionOptionItem | string): string | number | boolean {
    return typeof opt === 'string' ? opt : opt.value;
  }

  protected getOptionDesc(opt: QuestionOptionItem | string): string | undefined {
    return typeof opt === 'object' ? opt.description : undefined;
  }

  protected getOptionBadge(opt: QuestionOptionItem | string): string | undefined {
    return typeof opt === 'object' ? opt.badge : undefined;
  }
}

