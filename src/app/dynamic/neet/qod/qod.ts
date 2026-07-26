import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QodService } from '../../../core/serivce/qod.service';
import {
  QodQuestion,
  SubmitQodResponse
} from '../../../core/models/qod.model';

@Component({
  selector: 'app-qod',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qod.html',
  styleUrl: './qod.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QodComponent {

  readonly question = signal<QodQuestion | null>(null);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly selectedOption = signal<string | null>(null);
  readonly hasSubmitted = signal(false);
  readonly isQuestionOpen = signal(false);
  readonly submitResult = signal<SubmitQodResponse['data'] | null>(null);
  readonly errorMessage = signal<string | null>(null);

  constructor(
    private qodService: QodService
  ) {}

  loadQuestion(): void {
    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.qodService.getQuestionOfTheDay().subscribe({
      next: (response) => {
        this.question.set(response.data);
        this.hasSubmitted.set(response.data.alreadyAnswered);
        this.isQuestionOpen.set(true);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load Question of the Day:', error);
        this.errorMessage.set(
          error.error?.message ?? 'Unable to load the Question of the Day.'
        );
        this.isLoading.set(false);
      }
    });
  }

  openQuestion(): void {
    if (!this.question()) {
      this.loadQuestion();
      return;
    }
    this.isQuestionOpen.set(true);
  }

  closeQuestion(): void {
    if (!this.isSubmitting()) {
      this.isQuestionOpen.set(false);
      this.selectedOption.set(null);
      this.errorMessage.set(null);
    }
  }

  selectOption(option: string): void {

    if (this.hasSubmitted()) {
      return;
    }

    this.selectedOption.set(option);

  }

  submitAnswer(): void {
    const question = this.question();
    const selectedOption = this.selectedOption();

    if (!question || !selectedOption) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.qodService.submitAnswer({

      question_id: question.id,
      selected_option: selectedOption

    }).subscribe({

      next: (response) => {

        this.submitResult.set(response.data);
        this.hasSubmitted.set(true);
        this.isSubmitting.set(false);

      },

      error: (error) => {

        console.error('Failed to submit answer:', error);

        this.errorMessage.set(
          error.error?.message ?? 'Unable to submit your answer.'
        );
        this.isSubmitting.set(false);

      }

    });

  }

}
