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
import { Router } from '@angular/router';

import {
  UcatCustomTestSaveRequest,
  UcatTopic
} from '../../models/ucat.model';
import { UcatModalService, UcatSavedTestPayload } from '../../services/ucat-modal.service';
import { UcatService } from '../../services/ucat.service';

type WizardStep = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-ucat-quick-test',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quick-test.html',
  styleUrl: './quick-test.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UcatQuickTest implements OnInit {
  @Output() readonly testSaved = new EventEmitter<UcatSavedTestPayload>();

  private readonly router = inject(Router);
  private readonly ucatService = inject(UcatService);
  private readonly ucatModalService = inject(UcatModalService);

  readonly step = signal<WizardStep>(1);
  readonly testName = signal<string>('UCAT Custom Practice Test');
  readonly subjects = signal<string[]>([]);
  readonly chapters = signal<string[]>([]);
  readonly selectedSubjects = signal<string[]>([]);
  readonly selectedChapters = signal<string[]>([]);
  readonly topics = signal<UcatTopic[]>([]);
  readonly topicCount = signal(0);
  readonly questionCount = signal(15);
  readonly duration = signal(15);
  readonly level = signal('Intermediate');
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly questionCountOptions = [10, 15, 20, 25, 30];

  readonly trackByValue = (_index: number, value: string | number): string | number => value;

  ngOnInit(): void {
    this.loadSubjects();
  }

  loadSubjects(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.ucatService.getSubjects().subscribe({
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

    this.ucatService.getChapters({
      subjects: this.selectedSubjects()
    }).subscribe({
      next: (response) => {
        const chapterNames = (response.data ?? [])
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

    this.ucatService.getTopics({
      subjects: this.selectedSubjects(),
      chapters: this.selectedChapters()
    }).subscribe({
      next: (response) => {
        const topicList = response.data ?? [];
        this.topics.set(topicList);
        this.topicCount.set(response.total ?? topicList.length);
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
      this.isSaving() ||
      this.isLoading()
    ) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const topicIds = this.topics()
      .map((t) => Number(t.id ?? t._id))
      .filter((id) => !isNaN(id));

    const payload: UcatCustomTestSaveRequest = {
      title: this.testName().trim(),
      subjects: this.selectedSubjects(),
      chapters: this.selectedChapters(),
      topic_ids: topicIds,
      questionCount: this.questionCount(),
      duration: this.duration(),
      level: this.level()
    };

    this.ucatService.saveCustomTest(payload).subscribe({
      next: (_response) => {
        this.isSaving.set(false);
        const eventData: UcatSavedTestPayload = {
          title: payload.title,
          subjects: payload.subjects,
          chapters: payload.chapters,
          questionCount: payload.questionCount,
          duration: payload.duration
        };
        this.testSaved.emit(eventData);
        this.ucatModalService.saveTest(eventData);
        if (this.router.url.includes('/quick-test')) {
          void this.router.navigate(['/dynamic/ucat']);
        }
      },
      error: (error) => {
        this.isSaving.set(false);
        this.errorMessage.set(
          this.getErrorMessage(error, 'Unable to save custom test. Please try again.')
        );
      }
    });
  }

  private getErrorMessage(error: any, fallback: string): string {
    if (error?.status === 403) {
      return 'You are not authorized to perform this operation.';
    }
    if (error?.status === 429) {
      return 'Too many requests. Please wait a moment before trying again.';
    }
    if (error?.error?.message) {
      return error.error.message;
    }
    return fallback;
  }
}
