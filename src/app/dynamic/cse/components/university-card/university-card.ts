import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { University } from '../../models/university.model';

@Component({
  selector: 'app-cse-university-card',
  standalone: true,
  imports: [],
  templateUrl: './university-card.html',
  styleUrl: './university-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UniversityCard {
  readonly university = input.required<University>();
  readonly selectCard = output<University>();

  protected onCardClick(): void {
    this.selectCard.emit(this.university());
  }
}
