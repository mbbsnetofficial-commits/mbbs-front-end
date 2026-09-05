import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  ElementRef,
  viewChild,
  inject,
  PLATFORM_ID,
  afterNextRender,
  DestroyRef
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  GroupedCountryUniversities,
  AdminUniversity,
  AdminCountry
} from '../../../../../shared/models/admin-university.model';
import { CseService } from '../../../../../shared/services/cse.service';
import {
  NATURAL_EARTH_COUNTRIES,
  CountryVector,
  CountryCoordinate,
  COUNTRY_COORDINATES,
  lookupCountryCoordinate,
  projectCoordinates
} from './destinations-geo.data';

/**
 * Destination Marker model combining dynamic API Country Data with Geographic Map Projections.
 * Country names are strictly derived from the Countries API response (country.name).
 */
export interface DestinationMarker {
  id: string;
  countryName: string;
  countryCode: string;
  slug: string;
  displayOrder: number;
  lat: number;
  lng: number;
  x: number;
  y: number;
  percentX: number;
  percentY: number;
  continent: string;
  universityCount: number;
  universities: AdminUniversity[];
  showLabel: boolean;
  // Aliases for seamless binding
  name: string;
  code: string;
  hasGeo: boolean;
}

@Component({
  selector: 'app-destinations-map',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './destinations-map.html',
  styleUrl: './destinations-map.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DestinationsMap {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly cseService = inject(CseService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly mapSection = viewChild<ElementRef<HTMLElement>>('mapSection');

  /** Optional custom countries override (for testing or dashboard pass-through) */
  public readonly customCountries = input<AdminCountry[] | null>(null);

  /** Live Grouped Universities passed from Dashboard / CseService */
  public readonly groupedUniversities = input<GroupedCountryUniversities[]>([]);
  public readonly loading = input<boolean>(false);

  /** Countries API dynamic loading state */
  public readonly apiCountries = signal<AdminCountry[]>([]);
  public readonly apiCount = signal<number>(0);
  public readonly countriesLoading = signal<boolean>(false);

  /** Geographic Vector Map Landmass data */
  protected readonly countries: CountryVector[] = NATURAL_EARTH_COUNTRIES;

  /** Continent Navigation Filter */
  public readonly continents: readonly string[] = [
    'ALL',
    'EUROPE',
    'ASIA',
    'AMERICAS',
    'AFRICA',
    'OCEANIA'
  ];
  public readonly selectedContinent = signal<string>('ALL');

  /** Interactive Selection & Hover States */
  public readonly activeCountryCode = signal<string>('GE');
  protected readonly hoveredCountryCode = signal<string | null>(null);

  /** Progressive Visibility */
  protected readonly isRevealed = signal<boolean>(true);

  public readonly isMobileView = signal<boolean>(false);
  public readonly viewportWidth = signal<number>(1440);

  /** Responsive dynamic SVG viewBox tuned for full-bleed cover behavior across all screen sizes */
  public readonly mapViewBox = computed<string>(() => {
    if (this.isMobileView()) {
      return '470 10 360 420';
    }
    const w = this.viewportWidth();
    if (w <= 680) {
      return '470 10 360 420';
    }
    if (w <= 900) {
      return '310 25 640 360';
    }
    if (w <= 1150) {
      return '130 25 840 395';
    }
    return '110 30 840 395';
  });

  /**
   * Active countries extracted from the API response.
   * Filtered strictly for status === 'ACTIVE' and sorted by backend display_order.
   */
  public readonly activeCountries = computed<AdminCountry[]>(() => {
    const raw = this.customCountries() ?? this.apiCountries();
    return (raw || [])
      .filter(c => c && c.status === 'ACTIVE')
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  });

  /**
   * Dynamic Total Destinations Count derived directly from the Countries API response.
   * Uses response.count or active countries length.
   */
  public readonly totalDestinationsCount = computed<number>(() => {
    const count = this.apiCount();
    if (count > 0 && !this.customCountries()) {
      return count;
    }
    return this.activeCountries().length;
  });

  /**
   * Dynamic Total Universities Count derived from Universities API data.
   */
  public readonly totalUniversitiesCount = computed<number>(() => {
    return this.groupedUniversities().reduce((sum, g) => sum + (g.universities?.length || 0), 0);
  });

  /**
   * Lookup map of universities by countryId and countryCode.
   */
  private readonly universitiesByCountryId = computed<Map<string, AdminUniversity[]>>(() => {
    const map = new Map<string, AdminUniversity[]>();
    for (const group of this.groupedUniversities()) {
      if (group.countryId) {
        map.set(String(group.countryId), group.universities || []);
      }
      if (group.countryCode) {
        map.set(group.countryCode.toUpperCase(), group.universities || []);
      }
    }
    return map;
  });

  /**
   * Active Destination Markers on Map.
   * Combines dynamic API country names with spatial coordinate projection.
   * Includes smart collision-avoidance so labels are legible without visual overlap.
   */
  public readonly activeCountryMarkers = computed<DestinationMarker[]>(() => {
    const countries = this.activeCountries();
    const unisMap = this.universitiesByCountryId();
    const markers: DestinationMarker[] = [];
    const activeCode = this.activeCountryCode();

    for (const c of countries) {
      const code = (c.country_code || '').trim().toUpperCase();
      const coord = lookupCountryCoordinate(code, c.slug);
      if (!coord) {
        console.warn(`[DestinationsMap] No coordinate mapping found for country: ${c.name} (${code || c.slug}). Skipping marker.`);
        continue;
      }

      const [x, y] = projectCoordinates(coord.lng, coord.lat);
      const percentX = Math.round(((x - 60) / 880) * 1000) / 10;
      const percentY = Math.round(((y - 45) / 380) * 1000) / 10;

      const matchingUnis = unisMap.get(String(c._id)) ||
                           unisMap.get(code) ||
                           [];

      markers.push({
        id: c._id,
        countryName: c.name, // Strictly from API!
        countryCode: code,
        slug: c.slug || '',
        displayOrder: c.display_order ?? 999,
        lat: coord.lat,
        lng: coord.lng,
        x,
        y,
        percentX,
        percentY,
        continent: coord.continent || 'Europe',
        universityCount: matchingUnis.length,
        universities: matchingUnis,
        showLabel: false,
        name: c.name,
        code,
        hasGeo: true
      });
    }

    // Label collision avoidance for clean cartographic typography
    const placedLabels: { x: number; y: number; isMainActive?: boolean }[] = [];

    // Active country always receives priority label display
    const activeMarker = markers.find(m => m.countryCode.toUpperCase() === activeCode.toUpperCase());
    if (activeMarker) {
      placedLabels.push({ x: activeMarker.x, y: activeMarker.y, isMainActive: true });
      activeMarker.showLabel = true;
    }

    for (const marker of markers) {
      if (marker === activeMarker) continue;

      const collides = placedLabels.some(p => {
        const xDist = p.isMainActive ? 46 : 32;
        const yDist = p.isMainActive ? 18 : 14;
        return Math.abs(marker.x - p.x) < xDist && Math.abs(marker.y - p.y) < yDist;
      });

      if (!collides) {
        placedLabels.push({ x: marker.x, y: marker.y });
        marker.showLabel = true;
      }
    }

    return markers;
  });

  /**
   * Filtered markers by continent.
   */
  public readonly filteredDestinations = computed<DestinationMarker[]>(() => {
    const all = this.activeCountryMarkers();
    const cont = this.selectedContinent();
    if (cont === 'ALL') {
      return all;
    }
    return all.filter(m => (m.continent || '').toUpperCase() === cont);
  });

  /** Aliases for template & backwards compatibility */
  public readonly normalizedDestinations = computed<DestinationMarker[]>(() => {
    return this.activeCountryMarkers();
  });

  public readonly displayMajorDestinations = computed<DestinationMarker[]>(() => {
    return this.activeCountryMarkers();
  });

  /**
   * Active Destination exhibit data.
   */
  public readonly activeDestination = computed<DestinationMarker | null>(() => {
    const markers = this.activeCountryMarkers();
    if (markers.length === 0) return null;

    const selectedCode = this.activeCountryCode();
    if (selectedCode) {
      const match = markers.find(
        m => m.countryCode.toUpperCase() === selectedCode.toUpperCase() ||
             m.slug.toLowerCase() === selectedCode.toLowerCase() ||
             m.countryName.toLowerCase() === selectedCode.toLowerCase()
      );
      if (match) return match;
    }

    const georgia = markers.find(m => m.countryCode.toUpperCase() === 'GE');
    return georgia || markers[0];
  });

  /**
   * Origin country resolved dynamically from the API response.
   * If India is returned in the API, its country.name is used.
   * If India is not in the API, originCountry is null and the origin node is gracefully omitted.
   * Strictly NO hardcoded text "INDIA".
   */
  public readonly originCountry = computed<AdminCountry | null>(() => {
    const raw = this.customCountries() ?? this.apiCountries();
    return (raw || []).find(c =>
      (c.country_code || '').toUpperCase() === 'IN' ||
      (c.slug || '').toLowerCase() === 'india'
    ) || null;
  });

  constructor() {
    this.loadCountriesFromApi();
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => {
        this.checkMobileViewport();
        const handler = () => this.checkMobileViewport();
        window.addEventListener('resize', handler, { passive: true });
        this.destroyRef.onDestroy(() => {
          window.removeEventListener('resize', handler);
        });
        this.setupIntersectionObserver();
      });
    }
  }

  public loadCountriesFromApi(): void {
    this.countriesLoading.set(true);
    this.cseService.getAdminCountriesResponse().subscribe({
      next: (res) => {
        if (res && Array.isArray(res.data)) {
          this.apiCountries.set(res.data);
          this.apiCount.set(res.count ?? res.data.length);
        }
        this.countriesLoading.set(false);
      },
      error: (err) => {
        console.warn('[DestinationsMap] Error loading countries from API:', err);
        this.countriesLoading.set(false);
      }
    });
  }

  private checkMobileViewport(): void {
    if (typeof window !== 'undefined') {
      const w = window.innerWidth;
      this.viewportWidth.set(w);
      this.isMobileView.set(w <= 680);
    }
  }

  public selectContinent(continent: string): void {
    const clean = (continent || 'ALL').toUpperCase();
    this.selectedContinent.set(clean);

    const filtered = this.filteredDestinations();
    const active = this.activeDestination();
    if (active && !filtered.some(d => d.countryCode.toUpperCase() === active.countryCode.toUpperCase())) {
      if (filtered.length > 0) {
        this.activeCountryCode.set(filtered[0].countryCode);
      }
    }
  }

  public selectDestination(codeOrName: string): void {
    if (!codeOrName) return;
    const all = this.activeCountryMarkers();
    const match = all.find(
      d => d.countryCode.toUpperCase() === codeOrName.toUpperCase() ||
           d.slug.toLowerCase() === codeOrName.toLowerCase() ||
           d.countryName.toLowerCase() === codeOrName.toLowerCase()
    );
    if (match) {
      this.activeCountryCode.set(match.countryCode);
    }
  }

  public onMarkerHover(countryCode: string | null): void {
    this.hoveredCountryCode.set(countryCode ? countryCode.toUpperCase() : null);
  }

  public onMarkerKeydown(event: KeyboardEvent, countryCode: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectDestination(countryCode);
    }
  }

  public getLabelDx(dest: DestinationMarker): number {
    const code = dest.countryCode.toUpperCase();
    if (code === 'AU' || code === 'GB' || code === 'HU' || code === 'AM' || code === 'MY' || code === 'PH' || code === 'SG') {
      return -7;
    }
    if (dest.x > 800) {
      return -7;
    }
    return 7;
  }

  public getLabelDy(dest: DestinationMarker): number {
    const code = dest.countryCode.toUpperCase();
    if (code === 'PL' || code === 'KZ') return -3.5;
    if (code === 'HU' || code === 'RO' || code === 'UZ' || code === 'SG') return 4;
    if (code === 'GE') return -3;
    if (code === 'AM') return 4.5;
    return 2.5;
  }

  public getLabelAnchor(dest: DestinationMarker): string {
    return this.getLabelDx(dest) < 0 ? 'end' : 'start';
  }

  public isCountryActive(code: string): boolean {
    const active = this.activeDestination();
    return active ? active.countryCode.toUpperCase() === code.toUpperCase() : false;
  }

  public isCountryHovered(code: string): boolean {
    return this.hoveredCountryCode() === code.toUpperCase();
  }

  public isCountrySupported(code: string): boolean {
    return this.activeCountryMarkers().some(d => d.countryCode.toUpperCase() === code.toUpperCase());
  }

  private setupIntersectionObserver(): void {
    const section = this.mapSection()?.nativeElement;
    if (!section || typeof IntersectionObserver === 'undefined') {
      this.isRevealed.set(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          this.isRevealed.set(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(section);
  }
}
