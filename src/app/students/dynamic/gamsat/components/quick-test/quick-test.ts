import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnInit,
  Output,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  GamsatCustomTestSaveRequest,
  GamsatSection,
  GamsatStartTestRequest,
  GamsatTopic
} from '../../models/gamsat.model';
import { GamsatModalService, GamsatSavedTestPayload } from '../../services/gamsat-modal.service';
import { GamsatService } from '../../services/gamsat.service';

type WizardStep = 1 | 2 | 3 | 4;

export interface SectionDisplayItem {
  id: string;
  name: string;
  code: string;
  description: string;
}

@Component({
  selector: 'app-gamsat-quick-test',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quick-test.html',
  styleUrl: './quick-test.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GamsatQuickTest implements OnInit {
  @Output() readonly testSaved = new EventEmitter<GamsatSavedTestPayload>();

  private readonly router = inject(Router);
  private readonly gamsatService = inject(GamsatService);
  private readonly gamsatModalService = inject(GamsatModalService);

  readonly step = signal<WizardStep>(1);
  readonly testName = signal<string>('GAMSAT Custom Practice Drill');

  readonly sections = signal<SectionDisplayItem[]>([]);
  readonly selectedSections = signal<string[]>([]);

  readonly topics = signal<GamsatTopic[]>([]);
  readonly selectedTopics = signal<(string | number)[]>([]);

  readonly questionCount = signal(15);
  readonly duration = signal(25);
  readonly level = signal('Intermediate');

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly questionCountOptions = [10, 15, 20, 25, 30, 40, 50];
  readonly difficultyOptions = ['Mixed', 'Easy', 'Medium', 'Hard'];

  readonly trackByValue = (_index: number, value: string | number): string | number => value;

  ngOnInit(): void {
    this.loadSections();
  }

  loadSections(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.gamsatService.getSections().subscribe({
      next: (response) => {
        const raw = response.data ?? [];
        const mapped: SectionDisplayItem[] = raw.map((item: any) => {
          if (typeof item === 'string') {
            return {
              id: item,
              code: item,
              name: this.formatSectionName(item),
              description: this.getSectionDescription(item)
            };
          }
          const s = item as any;
          const code = s.key || s.code || String(s.id || s.name);
          return {
            id: String(s.id || code),
            code,
            name: s.fullName || s.name || this.formatSectionName(code),
            description: s.description || this.getSectionDescription(code)
          };
        });

        // Default fallback if backend returns empty
        if (mapped.length === 0) {
          mapped.push(
            {
              id: 'WRITTEN_COMMUNICATION',
              code: 'WRITTEN_COMMUNICATION',
              name: 'Section I: Reasoning in Written Communication',
              description: 'Critical reasoning in written communication, argument structure, and thematic clarity'
            },
            {
              id: 'HUMANITIES_SOCIAL_SCIENCES',
              code: 'HUMANITIES_SOCIAL_SCIENCES',
              name: 'Section II: Critical Reasoning in Humanities & Social Sciences',
              description: 'Sociocultural interpretation, literary reasoning, and philosophical argumentation'
            },
            {
              id: 'BIOLOGICAL_PHYSICAL_SCIENCES',
              code: 'BIOLOGICAL_PHYSICAL_SCIENCES',
              name: 'Section III: Reasoning in Biological & Physical Sciences',
              description: 'Scientific problem solving across Biology (40%), Chemistry (40%), and Physics (20%)'
            }
          );
        }

        this.sections.set(mapped);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(this.getErrorMessage(error, 'Unable to load GAMSAT sections.'));
        this.isLoading.set(false);
      }
    });
  }

  toggleSection(sectionCode: string): void {
    this.selectedSections.update((selected) =>
      selected.includes(sectionCode)
        ? selected.filter((item) => item !== sectionCode)
        : [...selected, sectionCode]
    );
  }

  toggleAllSections(): void {
    if (this.selectedSections().length === this.sections().length) {
      this.selectedSections.set([]);
    } else {
      this.selectedSections.set(this.sections().map((s) => s.code));
    }
  }

  goToSections(): void {
    if (!this.testName().trim()) {
      return;
    }
    this.step.set(2);
  }

  goToTopics(): void {
    if (this.selectedSections().length === 0) {
      return;
    }
    this.step.set(3);
    this.loadTopics();
  }

  loadTopics(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.gamsatService.getTopics().subscribe({
      next: (response) => {
        const raw = Array.isArray(response?.data) ? response.data : [];
        const selected = this.selectedSections();

        // Filter topics to only those belonging to the user's selected section(s)
        const filtered = selected.length === 0
          ? raw
          : raw.filter((topic) => this.isTopicMatchingSections(topic, selected));

        this.topics.set(filtered);
        // Pre-select all matching topics by default for convenience
        this.selectedTopics.set(filtered.map((t: any) => t.id || t._id || t.name));
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(this.getErrorMessage(error, 'Unable to load practice topics. Please try again.'));
        this.isLoading.set(false);
      }
    });
  }

  private isTopicMatchingSections(topic: GamsatTopic, selectedSectionCodes: string[]): boolean {
    if (selectedSectionCodes.length === 0) return true;
    const topicSec = (topic.section || '').toLowerCase().replace(/[\s\-_]+/g, '');
    const topicChap = ((topic as any).chapter || '').toLowerCase().replace(/[\s\-_]+/g, '');

    return selectedSectionCodes.some((code) => {
      const normCode = code.toLowerCase().replace(/[\s\-_]+/g, '');
      const c = code.toUpperCase();
      if (c.includes('WRITTEN') || c === 'SECTION_I' || c === '1' || normCode === 'sec1' || normCode === 'section1') {
        return topicSec.includes('written') || topicChap.includes('written') || topicSec.includes('sec1') || topicSec.includes('section1');
      }
      if (c.includes('HUMANITIES') || c.includes('SOCIAL') || c === 'SECTION_II' || c === '2' || normCode === 'sec2' || normCode === 'section2') {
        return topicSec.includes('humanities') || topicSec.includes('social') || topicChap.includes('philosophy') || topicChap.includes('literature') || topicSec.includes('sec2') || topicSec.includes('section2');
      }
      if (c.includes('BIOLOGICAL') || c.includes('PHYSICAL') || c === 'SECTION_III' || c === '3' || normCode === 'sec3' || normCode === 'section3') {
        return topicSec.includes('biological') || topicSec.includes('physical') || topicChap.includes('biology') || topicChap.includes('chemistry') || topicChap.includes('physics') || topicChap.includes('quantitative') || topicChap.includes('scientific') || topicSec.includes('sec3') || topicSec.includes('section3');
      }
      return topicSec.includes(normCode) || topicChap.includes(normCode) || normCode.includes(topicSec);
    });
  }

  toggleTopic(topicId: string | number): void {
    this.selectedTopics.update((selected) =>
      selected.includes(topicId)
        ? selected.filter((item) => item !== topicId)
        : [...selected, topicId]
    );
  }

  toggleAllTopics(): void {
    if (this.selectedTopics().length === this.topics().length) {
      this.selectedTopics.set([]);
    } else {
      this.selectedTopics.set(this.topics().map((t) => t.id || t._id || t.name));
    }
  }

  goToConfiguration(): void {
    this.step.set(4);
    // Recalculate duration estimate based on question count (1.5 min per GAMSAT question)
    this.duration.set(Math.max(10, Math.round(this.questionCount() * 1.5)));
  }

  setQuestionCount(count: number): void {
    this.questionCount.set(count);
    this.duration.set(Math.max(10, Math.round(count * 1.5)));
  }

  setLevel(lvl: string): void {
    this.level.set(lvl);
  }

  previousStep(): void {
    this.step.update((s) => Math.max(1, s - 1) as WizardStep);
    this.errorMessage.set(null);
  }

  saveAndStartTest(): void {
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const difficultyVal = this.mapDifficultyToBackend(this.level());
    const isAllTopicsSelected = this.selectedTopics().length === this.topics().length;
    const topicIds = isAllTopicsSelected
      ? []
      : this.selectedTopics().map((t) => (typeof t === 'string' && /^\d+$/.test(t) ? Number(t) : t));

    const payload: GamsatCustomTestSaveRequest = {
      title: this.testName().trim() || 'GAMSAT Custom Practice Drill',
      sections: this.selectedSections(),
      topic_ids: topicIds,
      total_questions: this.questionCount(),
      questionCount: this.questionCount(),
      duration_minutes: this.duration(),
      duration: this.duration(),
      level: this.level(),
      difficulty: difficultyVal
    };

    this.gamsatService.saveCustomTest(payload).subscribe({
      next: (response) => {
        if (!response.success && (response as any).error) {
          this.isSaving.set(false);
          this.errorMessage.set(this.getErrorMessage((response as any).error, 'Unable to save custom test.'));
          return;
        }

        const testId =
          response.data?.custom_test_id ||
          response.data?.test_id ||
          response.data?.id ||
          (response as any).custom_test_id ||
          (response as any).test_id ||
          (response as any).id;

        if (!testId) {
          this.isSaving.set(false);
          this.errorMessage.set('Test created, but no valid test identifier was returned by the server.');
          return;
        }

        const eventPayload: GamsatSavedTestPayload = {
          title: payload.title,
          sections: payload.sections || [],
          questionCount: payload.questionCount || 0,
          duration: payload.duration || 0
        };

        this.testSaved.emit(eventPayload);
        this.gamsatModalService.saveTest(eventPayload);

        // Start session and route to practice test
        const startPayload: GamsatStartTestRequest = {
          custom_test_id: testId,
          test_id: testId,
          duration: payload.duration,
          total_questions: payload.questionCount,
          sections: payload.sections
        };

        this.gamsatService.startTest(startPayload).subscribe({
          next: (startRes) => {
            this.isSaving.set(false);
            const sid = startRes.sessionId || (startRes.data as any)?.sessionId;
            if (sid) {
              this.router.navigate(['/dynamic/gamsat/practice'], {
                queryParams: { sessionId: sid }
              });
            } else {
              this.router.navigate(['/dynamic/gamsat/practice'], {
                queryParams: { testId, start: 'true' }
              });
            }
          },
          error: () => {
            this.isSaving.set(false);
            this.router.navigate(['/dynamic/gamsat/practice'], {
              queryParams: { testId, start: 'true' }
            });
          }
        });
      },
      error: (error) => {
        this.isSaving.set(false);
        this.errorMessage.set(this.getErrorMessage(error, 'Unable to save custom test. Please check your criteria and try again.'));
      }
    });
  }

  private mapDifficultyToBackend(lvl: string): string {
    const l = (lvl || '').toLowerCase();
    if (l === 'easy' || l === 'beginner') return 'Easy';
    if (l === 'medium' || l === 'intermediate') return 'Medium';
    if (l === 'hard' || l === 'advanced') return 'Hard';
    return 'ALL';
  }

  private formatSectionName(code: string): string {
    if (code === 'SECTION_I' || code === '1' || code === 'WRITTEN_COMMUNICATION') return 'Section I: Reasoning in Written Communication';
    if (code === 'SECTION_II' || code === '2' || code === 'HUMANITIES_SOCIAL_SCIENCES') return 'Section II: Critical Reasoning in Humanities & Social Sciences';
    if (code === 'SECTION_III' || code === '3' || code === 'BIOLOGICAL_PHYSICAL_SCIENCES') return 'Section III: Reasoning in Biological & Physical Sciences';
    return code.replace(/_/g, ' ');
  }

  private getSectionDescription(code: string): string {
    const c = code.toUpperCase();
    if (c.includes('WRITTEN') || (c.includes('I') && !c.includes('II') && !c.includes('III'))) {
      return 'Critical reasoning in written communication, argument structure, and thematic clarity';
    }
    if (c.includes('HUMANITIES') || c.includes('SOCIAL') || (c.includes('II') && !c.includes('III'))) {
      return 'Sociocultural interpretation, literary reasoning, and philosophical argumentation';
    }
    if (c.includes('BIOLOGICAL') || c.includes('PHYSICAL') || c.includes('III')) {
      return 'Scientific problem solving across Biology (40%), Chemistry (40%), and Physics (20%)';
    }
    return 'GAMSAT examination section practice drill';
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null) {
      const err = error as any;
      if (typeof err.error?.message === 'string') return err.error.message;
      if (typeof err.error?.error?.message === 'string') return err.error.error.message;
      if (typeof err.message === 'string' && !err.message.startsWith('Http failure')) return err.message;
    }
    return fallback;
  }
}
