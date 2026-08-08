import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, Output, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Country } from '../../models/country.model';
import { CseService } from '../../services/cse.service';
import { CseStore } from '../../state/cse.store';

@Component({
  selector: 'app-cse-search-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-header.html',
  styleUrl: './search-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchHeaderComponent implements OnInit {
  private readonly cseService = inject(CseService);
  private readonly store = inject(CseStore);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  // Inputs
  @Input() title: string = 'Find Your Perfect MBBS Destination';
  @Input() subtitle: string = 'Discover the best medical universities based on your academic profile in under 2 minutes.';

  @Input() set searchValue(val: string | null | undefined) {
    const query = val ?? '';
    this.searchQuery.set(query);
    if (this.countries().length > 0) {
      this.filterCountries(query);
    }
  }

  // Outputs
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterSelect = new EventEmitter<string>();

  // Component Signals
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly countries = signal<Country[]>([]);
  readonly filteredCountries = signal<Country[]>([]);
  readonly selectedCountry = signal<Country | null>(null);
  readonly searchQuery = signal<string>('');
  readonly isDropdownOpen = signal<boolean>(false);

  ngOnInit(): void {
    const stored = this.store.selectedCountry();
    if (stored) {
      this.selectedCountry.set(stored);
      this.searchQuery.set(stored.name);
    }

    this.fetchActiveCountries();
  }

  fetchActiveCountries(): void {
    const cached = this.store.countries();
    if (cached && cached.length > 0) {
      this.countries.set(cached);
      this.filteredCountries.set(cached);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.cseService.getCountries().subscribe({
      next: (data) => {
        // Filter only active countries & sort by display_order ascending
        const active = (data || [])
          .filter(c => {
            if (c.is_active !== undefined) return c.is_active === true;
            if (c.status !== undefined) return c.status.toUpperCase() === 'ACTIVE';
            return true;
          })
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

        this.store.setCountries(active);
        this.countries.set(active);
        this.filteredCountries.set(active);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch countries in SearchHeaderComponent:', err);
        this.error.set('Failed to load study destinations. Please try again.');
        this.loading.set(false);
      }
    });
  }

  private filterCountries(query: string): void {
    const q = query.toLowerCase().trim();
    if (!q) {
      this.filteredCountries.set(this.countries());
      return;
    }

    const filtered = this.countries().filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    );
    this.filteredCountries.set(filtered);

    // If currently selected country doesn't match search, clear selection
    if (this.selectedCountry() && !this.selectedCountry()?.name.toLowerCase().includes(q)) {
      this.selectedCountry.set(null);
      this.store.selectCountry(null);
    }
  }

  protected onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
    this.isDropdownOpen.set(true);
    this.filterCountries(query);
    this.searchChange.emit(query);
  }

  protected onInputFocus(): void {
    if (!this.loading() && !this.error()) {
      this.isDropdownOpen.set(true);
    }
  }

  protected toggleDropdown(): void {
    if (!this.loading() && !this.error()) {
      this.isDropdownOpen.update(open => !open);
    }
  }

  protected selectCountry(country: Country): void {
    this.selectedCountry.set(country);
    this.store.selectCountry(country);
    this.searchQuery.set(country.name);
    this.isDropdownOpen.set(false);
    this.filterSelect.emit(country.name);
  }

  protected clearSelection(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedCountry.set(null);
    this.store.selectCountry(null);
    this.searchQuery.set('');
    this.filteredCountries.set(this.countries());
    this.isDropdownOpen.set(false);
    this.searchChange.emit('');
  }

  protected startAssessment(): void {
    let selected = this.selectedCountry();

    // Fallback: If no country explicitly selected via dropdown click, match searchQuery with active countries
    if (!selected && this.searchQuery()) {
      const q = this.searchQuery().trim().toLowerCase();
      selected = this.countries().find(c =>
        c.name.toLowerCase() === q ||
        c.code.toLowerCase() === q ||
        (c.country_id && c.country_id.toLowerCase() === q) ||
        (c.id && c.id.toLowerCase() === q)
      ) || null;
    }

    if (!selected) return;

    // 1. Store selectedCountry in cse.store.ts
    this.selectedCountry.set(selected);
    this.store.selectCountry(selected);

    const countryId = selected.country_id || selected.id || (selected as any)._id || selected.code;

    // 2. Navigate to /dynamic/cse/questions passing country_id & country via Router state
    this.router.navigate(['/dynamic/cse/questions'], {
      state: {
        country_id: countryId,
        country: selected
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen.set(false);
    }
  }
}

// Export alias for backward compatibility
export { SearchHeaderComponent as SearchHeader };
