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
    { number: 3, title: 'Student Details', subtitle: 'Add your contact and academic profile' },
    { number: 4, title: 'Recommendations', subtitle: 'Review your best-fit universities' }
  ]);

  readonly stepClick = output<number>();

  protected onStepClick(stepNumber: number): void {
    if (stepNumber <= this.currentStep()) {
      this.stepClick.emit(stepNumber);
    }
  }
}
