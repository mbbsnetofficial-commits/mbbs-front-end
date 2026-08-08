import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { Country } from '../models/country.model';
import { CseCountryQuestion, Question, StudentDetails } from '../models/question.model';
import { Recommendation } from '../models/recommendation.model';
import { University } from '../models/university.model';
import { CseService } from '../services/cse.service';

@Injectable({
  providedIn: 'root'
})
export class CseStore {
  private readonly cseService = inject(CseService);

  // State Signals
  private readonly loadingState = signal<boolean>(false);
  private readonly errorState = signal<string | null>(null);
  private readonly currentStepState = signal<number>(1);

  private readonly countriesState = signal<Country[]>([]);
  private readonly selectedCountryState = signal<Country | null>(null);

  private readonly questionsState = signal<(Question | CseCountryQuestion)[]>([]);
  private readonly answersState = signal<Record<string, any>>({});

  private readonly studentDetailsState = signal<StudentDetails | null>({
    fullName: '',
    email: '',
    phone: '',
    neetScore: undefined,
    class12Percentage: undefined,
    preferredBudget: '',
    targetYear: '2026',
    city: ''
  });

  private readonly recommendationsState = signal<Recommendation[]>([]);
  private readonly sessionIdState = signal<string | null>(null);
  private readonly selectedUniversityState = signal<University | null>(null);
  private readonly searchQueryState = signal<string>('');

  // Readonly public signals
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly currentStep = this.currentStepState.asReadonly();

  readonly countries = this.countriesState.asReadonly();
  readonly selectedCountry = this.selectedCountryState.asReadonly();

  readonly questions = this.questionsState.asReadonly();
  readonly answers = this.answersState.asReadonly();

  readonly studentDetails = this.studentDetailsState.asReadonly();

  readonly recommendations = this.recommendationsState.asReadonly();
  readonly sessionId = this.sessionIdState.asReadonly();
  readonly selectedUniversity = this.selectedUniversityState.asReadonly();
  readonly searchQuery = this.searchQueryState.asReadonly();

  // Computed signals
  readonly filteredCountries = computed(() => {
    const q = this.searchQueryState().trim().toLowerCase();
    const list = this.countriesState();
    if (!q) return list;
    return list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.description?.toLowerCase().includes(q) ?? false) ||
      (c.advantages?.some(a => a.toLowerCase().includes(q)) ?? false)
    );
  });

  readonly isQuestionnaireComplete = computed(() => {
    const questions = this.questionsState();
    const answers = this.answersState();
    if (questions.length === 0) return true;
    return questions.every(q => {
      if (!q.required) return true;
      const qId = (q as CseCountryQuestion).question_key || q.id || '';
      if (!qId) return true;
      const ans = answers[qId];
      if (ans === undefined || ans === null || ans === '') return false;
      if (Array.isArray(ans) && ans.length === 0) return false;
      return true;
    });
  });

  readonly isStudentDetailsValid = computed(() => {
    const details = this.studentDetailsState();
    if (!details) return false;
    return !!(details.fullName?.trim() && details.email?.trim() && details.phone?.trim());
  });

  readonly topRecommendations = computed(() => {
    return this.recommendationsState().slice(0, 3);
  });

  // Actions
  setSearchQuery(query: string): void {
    this.searchQueryState.set(query);
  }

  selectCountry(country: Country | null): void {
    this.selectedCountryState.set(country);
  }

  setCountries(countries: Country[]): void {
    this.countriesState.set(countries);
  }

  setQuestions(questions: (Question | CseCountryQuestion)[]): void {
    this.questionsState.set(questions);
  }

  setAnswer(questionId: string, value: any): void {
    this.answersState.update(prev => ({
      ...prev,
      [questionId]: value
    }));
  }

  setStudentDetails(details: Partial<StudentDetails>): void {
    this.studentDetailsState.update(prev => {
      const current = prev ?? { fullName: '', email: '', phone: '' };
      return {
        ...current,
        ...details
      };
    });
  }

  setStep(step: number): void {
    if (step >= 1 && step <= 5) {
      this.currentStepState.set(step);
    }
  }

  nextStep(): void {
    this.currentStepState.update(s => Math.min(s + 1, 5));
  }

  prevStep(): void {
    this.currentStepState.update(s => Math.max(s - 1, 1));
  }

  loadCountries(): void {
    if (this.loadingState()) return;
    if (this.countriesState().length > 0 && !this.searchQueryState()) return;
    this.loadingState.set(true);
    this.errorState.set(null);

    this.cseService.getCountries(this.searchQueryState()).pipe(
      finalize(() => this.loadingState.set(false))
    ).subscribe({
      next: (data) => this.countriesState.set(data),
      error: (err) => {
        console.error('Failed to load countries:', err);
        this.errorState.set('Unable to load countries. Please try again.');
      }
    });
  }

  loadQuestions(): void {
    this.cseService.getQuestions().subscribe({
      next: (data) => this.questionsState.set(data),
      error: (err) => console.error('Failed to load questions:', err)
    });
  }

  private buildRecommendationPayload(
    country: Country | null,
    answers: Record<string, any>,
    studentDetails: StudentDetails | null
  ): any {
    const countryId = country?._id || country?.country_id || country?.id || '';

    // PCB Percentage
    let pcb: number | undefined = studentDetails?.class12Percentage;
    if (pcb === undefined && answers['pcb_percentage'] !== undefined) {
      const parsed = Number(answers['pcb_percentage']);
      if (!isNaN(parsed)) pcb = parsed;
    }
    if (pcb === undefined && answers['subject_results']) {
      const sr = answers['subject_results'];
      const p = Number(sr.physics);
      const c = Number(sr.chemistry);
      const b = Number(sr.biology);
      if (!isNaN(p) && !isNaN(c) && !isNaN(b)) {
        pcb = Math.round((p + c + b) / 3);
      }
    }

    // NEET Score (Optional: omit from payload if student did not enter it)
    let neet: number | undefined = studentDetails?.neetScore;
    if (neet === undefined && answers['neet_score'] !== undefined && answers['neet_score'] !== null && answers['neet_score'] !== '') {
      const parsed = Number(answers['neet_score']);
      if (!isNaN(parsed)) neet = parsed;
    }

    // Budget USD
    let budget: number | undefined;
    const rawBudget = answers['budget_usd'] ?? answers['annual_budget_usd'] ?? answers['budget'] ?? studentDetails?.preferredBudget;
    if (rawBudget !== undefined && rawBudget !== null) {
      if (typeof rawBudget === 'number') {
        budget = rawBudget;
      } else {
        const match = String(rawBudget).replace(/,/g, '').match(/\d+/);
        if (match) budget = Number(match[0]);
      }
    }

    // Preferred Language
    let lang = answers['preferred_language'] || answers['language'];
    if (!lang && answers['english_proficiency'] !== undefined) {
      lang = answers['english_proficiency'] ? 'English' : 'English';
    }
    if (!lang) lang = 'English';

    const reqAnswers: Record<string, any> = {
      pcb_percentage: pcb ?? 60,
      budget_usd: budget ?? 10000,
      preferred_language: String(lang)
    };

    if (neet !== undefined && neet !== null && !isNaN(neet) && String(neet).trim() !== '') {
      reqAnswers['neet_score'] = Number(neet);
    }

    if (studentDetails?.targetYear) {
      reqAnswers['preferred_intake'] = String(studentDetails.targetYear);
    }

    return {
      country_id: String(countryId),
      answers: reqAnswers,
      student_info: {
        name: studentDetails?.fullName || '',
        email: studentDetails?.email || '',
        phone: studentDetails?.phone || ''
      }
    };
  }

  generateRecommendations(): void {
    this.loadingState.set(true);
    this.errorState.set(null);

    const country = this.selectedCountryState();
    const answers = this.answersState();
    const details = this.studentDetailsState();

    const payload = this.buildRecommendationPayload(country, answers, details);

    this.cseService.getRecommendations(payload).pipe(
      finalize(() => this.loadingState.set(false))
    ).subscribe({
      next: (res) => {
        this.sessionIdState.set(res.sessionId || null);
        this.recommendationsState.set(res.recommendations);
        this.currentStepState.set(4);
      },
      error: (err) => {
        console.error('Failed to get recommendations:', err);
        this.recommendationsState.set([]);
        this.errorState.set(err?.message || 'Failed to generate recommendations from API. Please try again.');
      }
    });
  }

  loadUniversityDetails(id: string): void {
    this.loadingState.set(true);
    this.errorState.set(null);

    this.cseService.getUniversityById(id).pipe(
      finalize(() => this.loadingState.set(false))
    ).subscribe({
      next: (uni) => {
        if (uni) {
          this.selectedUniversityState.set(uni);
        } else {
          this.errorState.set('University not found.');
        }
      },
      error: (err) => {
        console.error('Failed to load university details:', err);
        this.errorState.set('Failed to fetch university profile.');
      }
    });
  }

  resetWorkflow(): void {
    this.selectedCountryState.set(null);
    this.answersState.set({});
    this.recommendationsState.set([]);
    this.sessionIdState.set(null);
    this.selectedUniversityState.set(null);
    this.currentStepState.set(1);
  }
}
