import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface StepItem {
  number: number;
  title: string;
  subtitle?: string;
}

@Component({
  selector: 'app-cse-progress-stepper',
  standalone: true,
  imports: [],
  templateUrl: './progress-stepper.html',
  styleUrl: './progress-stepper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressStepper {
  readonly currentStep = input.required<number>();
  readonly steps = input<StepItem[]>([
    { number: 1, title: 'Country Selection', subtitle: 'Choose Destination' },
    { number: 2, title: 'Preference Quiz', subtitle: 'Eligibility & Budget' },
    { number: 3, title: 'Student Profile', subtitle: 'Contact Details' },
    { number: 4, title: 'Recommendations', subtitle: 'AI Matches' }
  ]);

  readonly stepClick = output<number>();

  protected onStepClick(stepNumber: number): void {
    if (stepNumber <= this.currentStep()) {
      this.stepClick.emit(stepNumber);
    }
  }
}
