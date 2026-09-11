import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AdminCountry,
  AdminUniversity,
  GroupedCountryUniversities,
} from '../../../../../shared/models/admin-university.model';
import { CseService } from '../../../../../shared/services/cse.service';
import { lookupCountryCoordinate } from './destinations-geo.data';
import { exactCoordinates } from './globe-geography';
import { verifiedUniversityLocation } from './verified-university-locations.data';
import type { DestinationGlobe, GlobeAnchor, ScreenAnchor } from './destination-globe';

export interface DestinationMarker {
  id: string;
  countryName: string;
  countryCode: string;
  slug: string;
  lat: number;
  lng: number;
  universityCount: number;
  universities: AdminUniversity[];
}
export interface UniversityMarker {
  id: string;
  name: string;
  countryName: string;
  city?: string;
  type?: string;
  lat: number;
  lng: number;
  website?: string;
  locationLabel?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  imageUrl?: string | null;
  logoUrl?: string | null;
  coordinateSource: 'api' | 'verified';
}

@Component({
  selector: 'app-destinations-map',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './destinations-map.html',
  styleUrl: './destinations-map.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DestinationsMap {
  private readonly cseService = inject(CseService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly section = viewChild<ElementRef<HTMLElement>>('mapSection');
  private readonly stage = viewChild<ElementRef<HTMLElement>>('globeHost');
  readonly customCountries = input<AdminCountry[] | null>(null);
  readonly groupedUniversities = input<GroupedCountryUniversities[]>([]);
  readonly loading = input(false);
  readonly apiCountries = signal<AdminCountry[]>([]);
  readonly internalUniversities = signal<AdminUniversity[]>([]);
  readonly countriesLoading = signal(true);
  readonly universitiesLoading = signal(true);
  readonly renderState = signal<'loading' | 'ready' | 'unavailable'>('loading');
  readonly terrainState = signal<'loading' | 'ready' | 'unavailable'>('ready');
  readonly activeCountryCode = signal('');
  readonly isZooming = signal(false);
  readonly selectedUniversityId = signal('');
  readonly hoveredUniversityId = signal('');
  readonly failedMediaUrls = signal<ReadonlySet<string>>(new Set());
  readonly projectedAnchors = signal<ScreenAnchor[]>([]);
  private globe?: DestinationGlobe;
  private starting = false;
  private initialization = 0;
  private nearObserver?: IntersectionObserver;
  private visibilityObserver?: IntersectionObserver;

  readonly activeCountries = computed(() =>
    (this.customCountries() ?? this.apiCountries())
      .filter((c) => c.status === 'ACTIVE')
      .slice()
      .sort((a, b) => a.display_order - b.display_order),
  );
  readonly activeCountryMarkers = computed<DestinationMarker[]>(() =>
    this.activeCountries().flatMap((c) => {
      const geo = lookupCountryCoordinate(c.country_code, c.slug);
      if (!geo) return [];
      const group = this.groupedUniversities().find((g) => g.countryId === c._id);
      // Merge by id without mutating the parent's grouped arrays. Never create placeholder records.
      const records = new Map<string, AdminUniversity>();
      for (const u of [
        ...(group?.universities ?? []),
        ...this.internalUniversities().filter((u) => String(u.country_id) === String(c._id)),
      ]) {
        if (u.status !== 'INACTIVE') records.set(u._id, u);
      }
      const universities = [...records.values()];
      return [
        {
          id: c._id,
          countryName: c.name,
          countryCode: c.country_code.toUpperCase(),
          slug: c.slug,
          lat: geo.lat,
          lng: geo.lng,
          universityCount: universities.length,
          universities,
        },
      ];
    }),
  );
  readonly selectedCountry = computed(
    () =>
      this.activeCountryMarkers().find((c) => c.countryCode === this.activeCountryCode()) ?? null,
  );
  readonly isCountryView = computed(() => !!this.selectedCountry());
  readonly isWorldView = computed(() => !this.isCountryView());
  readonly totalDestinationsCount = computed(() => this.activeCountryMarkers().length);
  readonly totalUniversitiesCount = computed(() =>
    this.activeCountryMarkers().reduce((n, c) => n + c.universityCount, 0),
  );
  readonly activeCountryUniversities = computed<UniversityMarker[]>(() => {
    const country = this.selectedCountry();
    return (
      country?.universities.flatMap((u) => {
        const apiGeo = exactCoordinates(u.latitude ?? u.lat, u.longitude ?? u.lng);
        const verified = apiGeo ? null : verifiedUniversityLocation(country.countryCode, u.name);
        const geo = apiGeo ?? verified;
        if (!geo) return [];
        return [
          {
            id: u._id,
            name: u.name,
            countryName: country.countryName,
            city: u.city || u.locations?.[0]?.cities?.[0] || verified?.city,
            type: u.type,
            ...geo,
            website: u.official_website,
            locationLabel: verified?.locationLabel,
            sourceLabel: apiGeo ? 'MBBS.NET API coordinates' : verified?.sourceLabel,
            sourceUrl: apiGeo ? undefined : verified?.sourceUrl,
            imageUrl: u.image_url ?? verified?.imageUrl ?? null,
            logoUrl: u.logo_url ?? verified?.logoUrl ?? null,
            coordinateSource: apiGeo ? 'api' : 'verified',
          },
        ];
      }) ?? []
    );
  });
  readonly unmappedCount = computed(
    () => (this.selectedCountry()?.universityCount ?? 0) - this.activeCountryUniversities().length,
  );
  readonly activeUniversity = computed(
    () =>
      this.selectedCountry()?.universities.find(
        (u) => u._id === (this.selectedUniversityId() || this.hoveredUniversityId()),
      ) ?? null,
  );
  readonly activeUniversityMarker = computed(
    () =>
      this.activeCountryUniversities().find(
        (u) => u.id === (this.selectedUniversityId() || this.hoveredUniversityId()),
      ) ?? null,
  );
  readonly activeUniversitySubtitle = computed(() => {
    const u = this.activeUniversity();
    const marker = this.activeUniversityMarker();
    return [
      u?.city || u?.locations?.[0]?.cities?.[0] || marker?.city,
      this.selectedCountry()?.countryName,
    ]
      .filter(Boolean)
      .join(', ');
  });
  readonly activeUniversityMedia = computed(() => {
    const u = this.activeUniversity();
    const marker = this.activeUniversityMarker();
    const failed = this.failedMediaUrls();
    return [u?.image_url, marker?.imageUrl, u?.logo_url, marker?.logoUrl].find(
      (url): url is string => !!url && /^https?:\/\//i.test(url) && !failed.has(url),
    );
  });
  readonly visibleAnchors = computed(() =>
    this.isCountryView() && this.isZooming() ? [] : this.projectedAnchors(),
  );

  constructor() {
    this.cseService
      .getAdminCountriesResponse()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (res) => {
          this.apiCountries.set(res.data ?? []);
          this.countriesLoading.set(false);
        },
        error: () => this.countriesLoading.set(false),
      });
    this.cseService
      .getAdminUniversities()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (unis) => {
          this.internalUniversities.set(unis);
          this.universitiesLoading.set(false);
        },
        error: () => this.universitiesLoading.set(false),
      });
    effect(() => {
      const anchors: GlobeAnchor[] = this.isCountryView()
        ? this.activeCountryUniversities().map((u) => ({
            id: u.id,
            label: u.name,
            lat: u.lat,
            lng: u.lng,
            kind: 'university',
          }))
        : this.activeCountryMarkers().map((c) => ({
            id: c.countryCode,
            label: c.countryName,
            lat: c.lat,
            lng: c.lng,
            kind: 'country',
          }));
      this.globe?.setAnchors(anchors);
    });
    afterNextRender(() => {
      const section = this.section()?.nativeElement;
      if (!section) return;
      if (typeof IntersectionObserver === 'undefined') {
        void this.initializeGlobe();
        return;
      }
      this.nearObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            this.nearObserver?.disconnect();
            void this.initializeGlobe();
          }
        },
        { rootMargin: '600px' },
      );
      this.nearObserver.observe(section);
      this.visibilityObserver = new IntersectionObserver((entries) =>
        this.globe?.setVisible(entries.some((e) => e.isIntersecting)),
      );
      this.visibilityObserver.observe(section);
    });
    this.destroyRef.onDestroy(() => {
      this.nearObserver?.disconnect();
      this.visibilityObserver?.disconnect();
      this.globe?.dispose();
    });
  }

  private async initializeGlobe(): Promise<void> {
    if (this.starting || this.renderState() === 'unavailable') return;
    this.starting = true;
    const initialization = ++this.initialization;
    try {
      if (typeof WebGL2RenderingContext === 'undefined') throw new Error('WebGL unavailable');
      const { DestinationGlobe } = await import('./destination-globe');
      if (this.destroyRef.destroyed || initialization !== this.initialization) return;
      this.globe = new DestinationGlobe(this.stage()!.nativeElement, {
        project: (anchors) => this.projectedAnchors.set(anchors),
        select: (code) => this.selectDestination(code),
        moving: (moving) => this.isZooming.set(moving),
        terrain: (state) => this.terrainState.set(state),
        lost: () => this.showUnavailable(),
      });
      await this.globe.initialize();
      if (this.destroyRef.destroyed || initialization !== this.initialization) return;
      this.renderState.set('ready');
      this.syncAnchors();
      if (this.activeCountryCode()) void this.globe.focus(this.activeCountryCode());
    } catch {
      if (!this.destroyRef.destroyed && initialization === this.initialization)
        this.showUnavailable();
    }
  }

  showUnavailable(): void {
    ++this.initialization;
    this.renderState.set('unavailable');
    this.isZooming.set(false);
    this.projectedAnchors.set([]);
    this.globe?.dispose();
    this.globe = undefined;
  }

  retryGlobe(): void {
    this.starting = false;
    this.renderState.set('loading');
    void this.initializeGlobe();
  }

  selectDestination(codeOrName: string): void {
    const key = codeOrName.trim().toLowerCase();
    const country = this.activeCountryMarkers().find((c) =>
      [c.countryCode, c.countryName, c.slug].some((s) => s.toLowerCase() === key),
    );
    if (!country) return;
    this.activeCountryCode.set(country.countryCode);
    this.clearUniversitySelection();
    this.syncAnchors();
    if (this.renderState() === 'ready') void this.globe?.focus(country.countryCode);
  }

  resetToWorldView(): void {
    this.activeCountryCode.set('');
    this.clearUniversitySelection();
    this.syncAnchors();
    this.terrainState.set('ready');
    this.globe?.reset();
  }

  private syncAnchors(): void {
    this.globe?.setAnchors(
      this.isCountryView()
        ? this.activeCountryUniversities().map((u) => ({
            id: u.id,
            label: u.name,
            lat: u.lat,
            lng: u.lng,
            kind: 'university',
          }))
        : this.activeCountryMarkers().map((c) => ({
            id: c.countryCode,
            label: c.countryName,
            lat: c.lat,
            lng: c.lng,
            kind: 'country',
          })),
    );
  }
  onAnchorClick(anchor: GlobeAnchor): void {
    if (anchor.kind === 'country') this.selectDestination(anchor.id);
    else this.selectUniversity(anchor.id);
  }
  selectUniversity(id: string): void {
    const nextId = this.selectedUniversityId() === id ? '' : id;
    this.selectedUniversityId.set(nextId);
    const marker = this.activeCountryUniversities().find((u) => u.id === nextId);
    if (marker) this.globe?.focusLocation({ lat: marker.lat, lng: marker.lng });
  }
  clearUniversitySelection(): void {
    this.selectedUniversityId.set('');
    this.hoveredUniversityId.set('');
  }
  zoom(direction: number): void {
    this.globe?.zoom(direction);
  }
  rotate(direction: number): void {
    this.globe?.rotate(direction * 12);
  }
  officialWebsite(url?: string): string | null {
    return url && /^https?:\/\//i.test(url) ? url : null;
  }
  onUniversityMediaError(url: string): void {
    this.failedMediaUrls.update((urls) => new Set(urls).add(url));
  }
}
