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
    { number: 1, title: 'Choose Destination', subtitle: 'Select your preferred country' },
    { number: 2, title: 'Answer Questions', subtitle: 'Tell us about your preferences' },
    { number: 3, title: 'View Courses', subtitle: 'See matching programs' },
    { number: 4, title: 'Shortlist & Apply', subtitle: 'Save and start application' }
  ]);

  readonly stepClick = output<number>();

  protected onStepClick(stepNumber: number): void {
    if (stepNumber <= this.currentStep()) {
      this.stepClick.emit(stepNumber);
    }
  }
}
