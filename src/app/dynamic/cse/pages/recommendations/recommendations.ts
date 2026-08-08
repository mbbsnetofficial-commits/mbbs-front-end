import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ProgressStepper } from '../../components/progress-stepper/progress-stepper';
import { RecommendationCard } from '../../components/recommendation-card/recommendation-card';
import { Recommendation } from '../../models/recommendation.model';
import { CseStore } from '../../state/cse.store';

@Component({
  selector: 'app-cse-recommendations',
  standalone: true,
  imports: [ProgressStepper, RecommendationCard],
  templateUrl: './recommendations.html',
  styleUrl: './recommendations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Recommendations implements OnInit {
  readonly store = inject(CseStore);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.store.setStep(4);
    if (this.store.recommendations().length === 0) {
      this.store.generateRecommendations();
    }
  }

  protected onViewUniversityDetails(recommendation: Recommendation): void {
    this.router.navigate(['/dynamic/cse/university-details', recommendation.universityId]);
  }

  protected onStepClick(stepNumber: number): void {
    if (stepNumber === 1) {
      this.router.navigate(['/dynamic/cse/country-selection']);
    } else if (stepNumber === 2) {
      this.router.navigate(['/dynamic/cse/questions']);
    } else if (stepNumber === 3) {
      this.router.navigate(['/dynamic/cse/student-details']);
    }
  }

  protected restartQuiz(): void {
    this.store.resetWorkflow();
    this.router.navigate(['/dynamic/cse/country-selection']);
  }
}
