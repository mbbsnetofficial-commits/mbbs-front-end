import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { CountryCard } from '../../components/country-card/country-card';
import { ProgressStepper } from '../../components/progress-stepper/progress-stepper';
import { SearchHeader } from '../../components/search-header/search-header';
import { Country } from '../../models/country.model';
import { CseStore } from '../../state/cse.store';

@Component({
  selector: 'app-cse-country-selection',
  standalone: true,
  imports: [SearchHeader, CountryCard, ProgressStepper],
  templateUrl: './country-selection.html',
  styleUrl: './country-selection.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountrySelection implements OnInit {
  readonly store = inject(CseStore);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.store.setStep(1);
    if (this.store.countries().length === 0) {
      this.store.loadCountries();
    }
  }

  protected onSearchQueryChange(query: string): void {
    this.store.setSearchQuery(query);
    this.store.loadCountries();
  }

  protected onFilterSelect(tag: string): void {
    this.store.setSearchQuery(tag);
    this.store.loadCountries();
  }

  protected onCountrySelect(country: Country): void {
    this.store.selectCountry(country);
  }

  protected onStepClick(stepNumber: number): void {
    if (stepNumber === 2) {
      this.router.navigate(['/dynamic/cse/questions']);
    }
  }

  protected proceedToQuestionnaire(): void {
    this.store.setStep(2);
    this.router.navigate(['/dynamic/cse/questions']);
  }
}
