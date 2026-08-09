import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { CountryCard } from '../../components/country-card/country-card';
import { SearchHeader } from '../../components/search-header/search-header';
import { Country } from '../../models/country.model';
import { CseStore } from '../../state/cse.store';

@Component({
  selector: 'app-cse-country-selection',
  standalone: true,
  imports: [SearchHeader, CountryCard],
  templateUrl: './country-selection.html',
  styleUrl: './country-selection.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountrySelection implements OnInit {
  readonly store = inject(CseStore);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  ngOnInit(): void {
    this.store.setStep(1);
    // Ensure all cards are visible when returning back to country selection
    this.store.setSearchQuery('');
    if (this.store.countries().length === 0) {
      this.store.loadCountries();
    }
  }

  protected goBack(): void {
    this.location.back();
  }

  protected onSearchQueryChange(query: string): void {
    this.store.setSearchQuery(query);
  }

  protected onFilterSelect(tag: string): void {
    if (!tag) {
      this.store.setSearchQuery('');
      return;
    }
    const isCountry = this.store.countries().some(c => c.name.toLowerCase() === tag.toLowerCase());
    if (isCountry) {
      this.store.setSearchQuery('');
    } else {
      this.store.setSearchQuery(tag);
    }
  }

  protected onCountrySelect(country: Country): void {
    this.store.selectCountry(country);
    // Smooth scroll down to the bottom sticky action bar
    setTimeout(() => {
      const bottomBar = document.querySelector('.sticky-action-bar');
      if (bottomBar) {
        bottomBar.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    }, 50);
  }

  protected onCountryActionClick(country: Country): void {
    this.store.selectCountry(country);
    this.proceedToQuestionnaire();
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
