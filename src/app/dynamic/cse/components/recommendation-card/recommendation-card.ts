import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Recommendation } from '../../models/recommendation.model';

@Component({
  selector: 'app-cse-recommendation-card',
  standalone: true,
  imports: [],
  templateUrl: './recommendation-card.html',
  styleUrl: './recommendation-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecommendationCard {
  readonly recommendation = input.required<Recommendation>();
  readonly viewDetails = output<Recommendation>();

  protected onViewClick(): void {
    this.viewDetails.emit(this.recommendation());
  }
}
