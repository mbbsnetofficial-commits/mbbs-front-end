import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Country } from '../../models/country.model';

@Component({
  selector: 'app-cse-country-card',
  standalone: true,
  imports: [],
  templateUrl: './country-card.html',
  styleUrl: './country-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountryCard {
  readonly country = input.required<Country>();
  readonly selected = input<boolean>(false);
  readonly selectCard = output<Country>();

  protected onCardClick(): void {
    this.selectCard.emit(this.country());
  }
}
