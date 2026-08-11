import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ProgressStepper } from '../../components/progress-stepper/progress-stepper';
import { CseStore } from '../../state/cse.store';

@Component({
  selector: 'app-cse-student-details',
  standalone: true,
  imports: [FormsModule, ProgressStepper],
  templateUrl: './student-details.html',
  styleUrl: './student-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentDetails implements OnInit {
  readonly store = inject(CseStore);
  private readonly router = inject(Router);

  // Form Fields
  fullName = '';
  email = '';
  phone = '';
  neetScore: number | undefined;
  class12Percentage: number | undefined;
  targetYear = '2026';
  city = '';

  ngOnInit(): void {
    if (!this.store.selectedCountry()) {
      this.router.navigate(['/dynamic/cse/country-selection']);
      return;
    }

    this.store.setStep(3);
    const existing = this.store.studentDetails();
    if (existing) {
      this.fullName = existing.fullName || '';
      this.email = existing.email || '';
      this.phone = existing.phone || '';
      this.neetScore = existing.neetScore;
      this.class12Percentage = existing.class12Percentage;
      this.targetYear = existing.targetYear || '2026';
      this.city = existing.city || '';
    }
  }

  protected updateDetails(): void {
    this.store.setStudentDetails({
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      neetScore: this.neetScore,
      class12Percentage: this.class12Percentage,
      targetYear: this.targetYear,
      city: this.city
    });
  }

  protected goBack(): void {
    this.router.navigate(['/dynamic/cse/questions']);
  }

  protected onStepClick(stepNumber: number): void {
    if (stepNumber === 1) {
      this.router.navigate(['/dynamic/cse/country-selection']);
    } else if (stepNumber === 2) {
      this.router.navigate(['/dynamic/cse/questions']);
    }
  }

  protected onSubmit(): void {
    if (!this.fullName?.trim() || !this.email?.trim() || !this.phone?.trim()) return;

    this.updateDetails();
    this.store.generateRecommendations();
    this.router.navigate(['/dynamic/cse/recommendations']);
  }
}
