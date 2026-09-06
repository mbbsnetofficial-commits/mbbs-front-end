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
  projectCoordinates,
  GeographicExtent,
  getCountryExtent,
  findCountryVector,
  unprojectCoordinates,
  getCountryGeoBBox,
  resolveUniversityCoordinates
} from './destinations-geo.data';

/**
 * Map Viewport Mode separating high-level World View from detailed Country View.
 */
export type MapViewMode = 'WORLD' | 'COUNTRY';

/**
 * University Marker on Country Map with genuine geographic coordinates
 * projected into SVG canvas coordinates.
 */
export interface UniversityMarker {
  id: string;
  name: string;
  shortName?: string;
  countryId: string;
  countryName: string;
  countryCode: string;
  city?: string;
  state?: string;
  type?: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  website?: string;
}

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

  /** Map Camera & View Mode State (Clean separation between World View and Country View) */
  public readonly viewMode = signal<MapViewMode>('WORLD');
  public readonly selectedCountry = signal<DestinationMarker | null>(null);
  public readonly isZooming = signal<boolean>(false);

  public readonly isWorldView = computed<boolean>(() => this.viewMode() === 'WORLD');
  public readonly isCountryView = computed<boolean>(() => this.viewMode() === 'COUNTRY');
  public readonly selectedCountryData = computed<DestinationMarker | null>(() => this.selectedCountry());

  /** Interactive Selection & Hover States */
  public readonly activeCountryCode = signal<string>('');
  protected readonly hoveredCountryCode = signal<string | null>(null);

  /** University markers & interaction state */
  public readonly internalUniversities = signal<AdminUniversity[]>([]);
  public readonly hoveredUniversity = signal<UniversityMarker | null>(null);
  public readonly selectedUniversity = signal<UniversityMarker | null>(null);
  public readonly activeUniversityPopup = computed<UniversityMarker | null>(() => {
    return this.selectedUniversity() ?? this.hoveredUniversity();
  });

  /** Dynamic High-Resolution Satellite Imagery Layer State */
  public readonly highResImageUrl = signal<string | null>(null);
  public readonly highResImageLoaded = signal<boolean>(false);
  public readonly highResImageBounds = signal<{ x: number; y: number; width: number; height: number } | null>(null);
  private readonly satelliteImageCache = new Map<string, string>();
  private readonly countryTargetViewBoxCache = new Map<string, [number, number, number, number]>();

  /** Progressive Visibility */
  protected readonly isRevealed = signal<boolean>(true);

  public readonly isMobileView = signal<boolean>(false);
  public readonly viewportWidth = signal<number>(1440);

  /** Responsive dynamic SVG viewBox coordinates for World View */
  public readonly worldViewBoxCoords = computed<[number, number, number, number]>(() => {
    if (this.isMobileView()) {
      return [470, 10, 360, 420];
    }
    const w = this.viewportWidth();
    if (w <= 680) {
      return [470, 10, 360, 420];
    }
    if (w <= 900) {
      return [310, 25, 640, 360];
    }
    if (w <= 1150) {
      return [130, 25, 840, 395];
    }
    return [110, 30, 840, 395];
  });

  /** Target SVG viewBox coordinates [minX, minY, width, height] for the selected destination */
  public readonly targetViewBoxCoords = signal<[number, number, number, number] | null>(null);

  /** Current active animated SVG viewBox coordinates [minX, minY, width, height] */
  public readonly currentViewBoxCoords = signal<[number, number, number, number] | null>(null);

  /**
   * Responsive dynamic SVG viewBox string tuned for full-bleed cover behavior.
   * Seamlessly binds to [attr.viewBox] on the SVG atlas element.
   */
  public readonly mapViewBox = computed<string>(() => {
    const coords = this.currentViewBoxCoords() ?? this.worldViewBoxCoords();
    return coords.map(v => Math.round(v * 10) / 10).join(' ');
  });

  /**
   * Geographic vector of the currently selected country.
   * Used for the clean dedicated top-level highlight outline.
   */
  public readonly activeCountryVector = computed<CountryVector | null>(() => {
    const code = this.activeCountryCode();
    if (!code) return null;
    return this.countries.find(c => c.code.toUpperCase() === code.toUpperCase()) ?? null;
  });

  /**
   * Normalized scale factor relative to standard world view (840px width).
   * Dynamically tracks the current viewBox width so labels and markers
   * scale proportionately and remain crisp and readable at any zoom level.
   */
  public readonly markerScaleFactor = computed<number>(() => {
    const coords = this.currentViewBoxCoords() ?? this.worldViewBoxCoords();
    const currentW = coords[2];
    const worldW = this.worldViewBoxCoords()[2];
    return Math.max(0.08, Math.min(1.0, currentW / worldW));
  });

  public readonly markerRingRadius = computed<number>(() => {
    return Math.max(0.4, Math.round(4.0 * this.markerScaleFactor() * 100) / 100);
  });

  public readonly markerPointRadius = computed<number>(() => {
    return Math.max(0.2, Math.round(2.0 * this.markerScaleFactor() * 100) / 100);
  });

  public readonly markerLabelFontSize = computed<number>(() => {
    return Math.max(0.6, Math.round(6.2 * this.markerScaleFactor() * 100) / 100);
  });

  public readonly markerSublabelFontSize = computed<number>(() => {
    return Math.max(0.5, Math.round(4.8 * this.markerScaleFactor() * 100) / 100);
  });

  public readonly uniDotRadius = computed<number>(() => {
    return Math.max(0.5, Math.round(1.5 * this.markerScaleFactor() * 100) / 100);
  });

  public readonly uniDotHitRadius = computed<number>(() => {
    return Math.max(2.5, Math.round(5.0 * this.markerScaleFactor() * 100) / 100);
  });

  public readonly uniLabelFontSize = computed<number>(() => {
    return Math.max(0.7, Math.round(4.5 * this.markerScaleFactor() * 100) / 100);
  });

  protected readonly Math = Math;

  /**
   * Active countries extracted from the API response.
   * Filtered strictly for status === 'ACTIVE' and sorted by backend display_order.
   */
  public readonly activeCountries = computed<AdminCountry[]>(() => {
    const raw = this.customCountries() ?? this.apiCountries();
    if (raw && raw.length > 0) {
      return raw
        .filter(c => c && c.status === 'ACTIVE')
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }

    // Resilience fallback: If API is temporarily rate-limited or unavailable,
    // gracefully derive active destinations from groupedUniversities
    const grouped = this.groupedUniversities();
    if (grouped && grouped.length > 0) {
      return grouped.map(g => ({
        _id: g.countryId,
        name: g.countryName,
        slug: g.countryName.toLowerCase().replace(/\s+/g, '-'),
        country_code: g.countryCode,
        status: 'ACTIVE',
        display_order: g.displayOrder
      }));
    }

    return [];
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
   * Leverages groupedUniversities input with fallback to internalUniversities cache.
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
    const internal = this.internalUniversities();
    if (internal && internal.length > 0) {
      for (const u of internal) {
        if (u.country_id) {
          const key = String(u.country_id);
          const list = map.get(key) || [];
          if (!list.some(existing => existing._id === u._id)) {
            list.push(u);
            map.set(key, list);
          }
        }
      }
    }
    return map;
  });

  /**
   * Authentic API-driven University Locations for the currently selected country.
   * Only includes universities with valid geographic coordinates.
   * Lacking coordinates? Omitted completely from map dots per specification rule 8.
   */
  public readonly activeCountryUniversities = computed<UniversityMarker[]>(() => {
    const selected = this.selectedCountry();
    if (!selected) return [];

    const countryId = String(selected.id || '');
    const countryCode = (selected.countryCode || '').trim().toUpperCase();
    const countryName = selected.countryName;

    // Gather universities for selected country
    let rawUnis: AdminUniversity[] = [];
    if (selected.universities && selected.universities.length > 0) {
      rawUnis = selected.universities;
    } else {
      const byMap = this.universitiesByCountryId().get(countryId) ||
                    this.universitiesByCountryId().get(countryCode) ||
                    [];
      if (byMap.length > 0) {
        rawUnis = byMap;
      } else {
        const allInternal = this.internalUniversities();
        rawUnis = allInternal.filter(u =>
          (u.country_id && String(u.country_id) === countryId) ||
          (selected.slug && u.country_id === selected.slug)
        );
      }
    }

    if (rawUnis.length === 0) return [];

    const activeUnis = rawUnis.filter(u => u && u.status !== 'INACTIVE');

    // Count how many universities share the same geographic base city
    const locationCounts = new Map<string, number>();
    const locationIndex = new Map<string, number>();

    for (const u of activeUnis) {
      let locKey = '';
      const directLat = u.latitude ?? u.lat;
      const directLon = u.longitude ?? u.lng;
      if (typeof directLat === 'number' && typeof directLon === 'number' && !isNaN(directLat) && !isNaN(directLon)) {
        locKey = `${directLon.toFixed(3)},${directLat.toFixed(3)}`;
      } else {
        const city = u.city || u.locations?.[0]?.cities?.[0];
        const state = u.locations?.[0]?.state;
        const coords = resolveUniversityCoordinates(city, state);
        if (coords) {
          locKey = `${coords[0].toFixed(3)},${coords[1].toFixed(3)}`;
        }
      }
      if (locKey) {
        locationCounts.set(locKey, (locationCounts.get(locKey) || 0) + 1);
      }
    }

    const markers: UniversityMarker[] = [];

    for (const u of activeUnis) {
      let lon: number | null = null;
      let lat: number | null = null;

      const directLat = u.latitude ?? u.lat;
      const directLon = u.longitude ?? u.lng;
      if (typeof directLat === 'number' && typeof directLon === 'number' && !isNaN(directLat) && !isNaN(directLon)) {
        lon = directLon;
        lat = directLat;
      } else {
        const city = u.city || u.locations?.[0]?.cities?.[0];
        const state = u.locations?.[0]?.state;
        const resolved = resolveUniversityCoordinates(city, state);
        if (resolved) {
          lon = resolved[0];
          lat = resolved[1];
        }
      }

      // Rule 8: If no valid coordinates exist, do NOT place randomly or at country center. Skip dot!
      if (lon === null || lat === null) {
        continue;
      }

      const locKey = `${lon.toFixed(3)},${lat.toFixed(3)}`;
      const totalInLoc = locationCounts.get(locKey) || 1;
      const currIndex = locationIndex.get(locKey) || 0;
      locationIndex.set(locKey, currIndex + 1);

      let finalLon = lon;
      let finalLat = lat;

      if (totalInLoc > 1) {
        // Micro-offset campuses within the metropolitan area (radius 0.04° to 0.08° lon/lat, ~3-7 km)
        // Golden angle distribution ensures optimal visual separation
        const radius = 0.045 + (currIndex % 3) * 0.015;
        const angle = (currIndex * 137.5 * Math.PI) / 180;
        finalLon = lon + radius * Math.cos(angle);
        finalLat = lat + (radius * 0.75) * Math.sin(angle);
      }

      const [projX, projY] = projectCoordinates(finalLon, finalLat);

      markers.push({
        id: u._id,
        name: u.name,
        shortName: u.short_name,
        countryId: String(u.country_id || countryId),
        countryName,
        countryCode,
        city: u.city || u.locations?.[0]?.cities?.[0],
        state: u.locations?.[0]?.state,
        type: u.type,
        lat: finalLat,
        lng: finalLon,
        x: projX,
        y: projY,
        website: u.official_website
      });
    }

    return markers;
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

      const [projX, projY] = projectCoordinates(coord.lng, coord.lat);
      const ext = getCountryExtent(code);
      const x = ext ? ext.cx : projX;
      const y = ext ? ext.cy : projY;
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

    const selected = this.selectedCountry();
    if (selected) return selected;

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
    this.loadUniversitiesFromApi();
    if (isPlatformBrowser(this.platformId)) {
      (window as any).__mbbsMap = this;
      afterNextRender(() => {
        this.checkMobileViewport();
        this.preloadTopDestinationsSatellite();
        const handler = () => this.checkMobileViewport();
        window.addEventListener('resize', handler, { passive: true });
        this.destroyRef.onDestroy(() => {
          window.removeEventListener('resize', handler);
          if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
          }
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

  /**
   * Intelligently loads and caches universities from API.
   * If already loaded or provided via input, reuses cached dataset without repeated requests.
   */
  public loadUniversitiesFromApi(): void {
    if (this.internalUniversities().length > 0 || this.groupedUniversities().length > 0) {
      return;
    }
    this.cseService.getAdminUniversities().subscribe({
      next: (unis) => {
        if (Array.isArray(unis) && unis.length > 0) {
          this.internalUniversities.set(unis);
        }
      },
      error: (err) => {
        console.warn('[DestinationsMap] Error loading universities from API:', err);
      }
    });
  }

  /**
   * Preloads high-resolution satellite imagery for active destinations
   * into memory cache so subsequent country clicks transition instantaneously
   * with zero low-resolution blurry flash.
   */
  public preloadTopDestinationsSatellite(): void {
    if (!isPlatformBrowser(this.platformId) || typeof Image === 'undefined') return;

    // Dynamically query active countries from API with fallback
    const active = this.activeCountries().map(c => (c.country_code || '').trim().toUpperCase()).filter(Boolean);
    const codesToPreload = active.length > 0
      ? active
      : ['KZ', 'RU', 'GE', 'HU', 'AU', 'PH', 'UZ', 'KG', 'EG', 'BY', 'PL', 'RO'];
    let delay = 100;

    for (const code of codesToPreload) {
      if (this.satelliteImageCache.has(code)) continue;

      setTimeout(() => {
        this.prefetchSatelliteImageForCountry(code);
      }, delay);

      delay += 150;
    }
  }

  /**
   * Proactively prefetches satellite imagery for a specific country
   * as soon as it is hovered or interacted with.
   */
  public prefetchSatelliteImageForCountry(code: string): void {
    if (!isPlatformBrowser(this.platformId) || typeof Image === 'undefined') return;
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode || this.satelliteImageCache.has(cleanCode)) return;

    const ext = getCountryExtent(cleanCode);
    const marker = this.activeCountryMarkers().find(m => m.countryCode.toUpperCase() === cleanCode) ||
      (ext ? { countryCode: cleanCode, x: ext.cx, y: ext.cy } as DestinationMarker : null);
    if (!marker) return;

    const targetViewBox = this.getCountryTargetViewBox(marker);
    if (!targetViewBox) return;

    const url = this.getSatelliteUrlForCountry(marker, targetViewBox);
    if (!url) return;

    const img = new Image();
    img.onload = () => {
      this.satelliteImageCache.set(cleanCode, url);
    };
    img.src = url;
  }

  private checkMobileViewport(): void {
    if (typeof window !== 'undefined') {
      const w = window.innerWidth;
      this.viewportWidth.set(w);
      this.isMobileView.set(w <= 680);
      this.countryTargetViewBoxCache.clear();

      if (this.viewMode() === 'COUNTRY' && this.selectedCountry() && !this.isZooming()) {
        this.currentViewBoxCoords.set(this.getCountryTargetViewBox(this.selectedCountry()!));
      }
    }
  }

  public selectContinent(continent: string): void {
    const clean = (continent || 'ALL').toUpperCase();
    this.selectedContinent.set(clean);

    const filtered = this.filteredDestinations();
    const active = this.activeDestination();
    if (active && !filtered.some(d => d.countryCode.toUpperCase() === active.countryCode.toUpperCase())) {
      if (filtered.length > 0) {
        this.selectDestination(filtered[0].countryCode);
      }
    }
  }

  /**
   * Generates the ArcGIS satellite imagery export URL for any destination and target viewBox.
   * Maps the exact viewBox rectangle to unprojected geographic bounds ensuring 1:1 pixel alignment
   * with the country's SVG boundary vector.
   */
  public getSatelliteUrlForCountry(marker: DestinationMarker, targetViewBox: [number, number, number, number]): string | null {
    const [targetX, targetY, targetW, targetH] = targetViewBox;
    const [lon1, lat1] = unprojectCoordinates(targetX, targetY);
    const [lon2, lat2] = unprojectCoordinates(targetX + targetW, targetY + targetH);

    const minLon = Math.max(-180, Math.min(lon1, lon2));
    const maxLon = Math.min(180, Math.max(lon1, lon2));
    const minLat = Math.max(-85, Math.min(lat1, lat2));
    const maxLat = Math.min(85, Math.max(lat1, lat2));

    const bboxParam = `${minLon.toFixed(4)},${minLat.toFixed(4)},${maxLon.toFixed(4)},${maxLat.toFixed(4)}`;
    const aspect = targetW / targetH;
    const reqW = 1600;
    const reqH = Math.max(300, Math.min(1600, Math.round(reqW / aspect)));
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${bboxParam}&bboxSR=4326&imageSR=4326&size=${reqW},${reqH}&format=jpg&f=image`;
  }

  /**
   * Selects destination country with instant UI response, immediate labels & university count,
   * proactive high-resolution satellite imagery loading, and smooth continuous camera zoom
   * eliminating the pixelated low-resolution raster flash.
   */
  public selectDestination(codeOrName: string): void {
    if (!codeOrName) return;
    const all = this.activeCountryMarkers();
    let match = all.find(
      d => d.countryCode.toUpperCase() === codeOrName.toUpperCase() ||
           d.slug.toLowerCase() === codeOrName.toLowerCase() ||
           d.countryName.toLowerCase() === codeOrName.toLowerCase()
    );

    if (!match) {
      // Generic fallback for any clickable country boundary on the globe
      const cleanCode = codeOrName.toUpperCase();
      const vec = findCountryVector(cleanCode);
      const coord = lookupCountryCoordinate(cleanCode);
      if (vec) {
        const ext = getCountryExtent(cleanCode);
        match = {
          id: cleanCode,
          countryName: vec.name,
          countryCode: cleanCode,
          slug: vec.name.toLowerCase().replace(/\s+/g, '-'),
          displayOrder: 999,
          lat: coord?.lat ?? 0,
          lng: coord?.lng ?? 0,
          x: ext?.cx ?? 500,
          y: ext?.cy ?? 235,
          percentX: 50,
          percentY: 50,
          continent: coord?.continent || 'Europe',
          universityCount: 0,
          universities: [],
          showLabel: true,
          name: vec.name,
          code: cleanCode,
          hasGeo: true
        };
      }
    }

    if (!match) return;

    // 1. Instantly select country state, labels, and clear previous university selection & raster
    this.selectedCountry.set(match);
    this.activeCountryCode.set(match.countryCode);
    this.viewMode.set('COUNTRY');
    this.isZooming.set(true);
    this.selectedUniversity.set(null);
    this.hoveredUniversity.set(null);
    this.highResImageLoaded.set(false);
    this.highResImageUrl.set(null);
    this.highResImageBounds.set(null);

    const target = this.getCountryTargetViewBox(match);
    this.targetViewBoxCoords.set(target);
    if (!this.currentViewBoxCoords()) {
      this.currentViewBoxCoords.set(this.worldViewBoxCoords());
    }
    this.highResImageBounds.set({ x: target[0], y: target[1], width: target[2], height: target[3] });

    if (!isPlatformBrowser(this.platformId) || typeof Image === 'undefined') {
      this.currentViewBoxCoords.set(target);
      this.highResImageLoaded.set(true);
      return;
    }

    const code = match.countryCode.toUpperCase();
    const url = this.getSatelliteUrlForCountry(match, target);

    if (!url) {
      this.animateToCountry(match);
      return;
    }

    // 2. Check if high-resolution satellite imagery is already cached
    if (this.satelliteImageCache.has(code)) {
      this.highResImageUrl.set(this.satelliteImageCache.get(code)!);
      this.highResImageLoaded.set(true);
      this.animateToCountry(match);
      return;
    }

    // 3. If not cached, reset loaded flag so previous country raster is not shown stretched
    this.highResImageLoaded.set(false);
    this.highResImageUrl.set(url);
    let zoomInitiated = false;

    const beginZoom = () => {
      if (zoomInitiated) return;
      zoomInitiated = true;
      if (this.activeCountryCode() === code && this.viewMode() === 'COUNTRY') {
        this.satelliteImageCache.set(code, url);
        this.highResImageLoaded.set(true);
        this.animateToCountry(match);
      }
    };

    if (isPlatformBrowser(this.platformId) && typeof Image !== 'undefined') {
      const img = new Image();
      img.onload = () => beginZoom();
      img.onerror = () => beginZoom();
      img.src = url;
      // Safety timeout: smooth zoom initiates within 350ms max even on slow connections
      setTimeout(() => beginZoom(), 350);
    } else {
      beginZoom();
    }
  }

  public onSatelliteImageLoaded(code: string, url: string): void {
    if (this.activeCountryCode() === code && this.highResImageUrl() === url) {
      this.highResImageLoaded.set(true);
      this.satelliteImageCache.set(code, url);
    }
  }

  /**
   * Smoothly returns camera to the full World View,
   * fades out country-specific imagery, clears university dots, and restores world markers.
   */
  public resetToWorldView(duration: number = 850): void {
    if (this.viewMode() === 'WORLD' && !this.selectedCountry()) return;

    const target = this.worldViewBoxCoords();
    this.targetViewBoxCoords.set(target);
    this.viewMode.set('WORLD');
    this.selectedCountry.set(null);
    this.activeCountryCode.set('');
    this.selectedUniversity.set(null);
    this.hoveredUniversity.set(null);
    this.highResImageLoaded.set(false);
    this.highResImageUrl.set(null);
    this.highResImageBounds.set(null);

    if (!isPlatformBrowser(this.platformId) || typeof requestAnimationFrame === 'undefined' || duration === 0) {
      this.currentViewBoxCoords.set(target);
      this.isZooming.set(false);
      return;
    }

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    const start = [...(this.currentViewBoxCoords() ?? target)] as [number, number, number, number];
    const startTime = performance.now();
    this.isZooming.set(true);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeInOutCubic(progress);

      const curX = start[0] + (target[0] - start[0]) * eased;
      const curY = start[1] + (target[1] - start[1]) * eased;
      const curW = start[2] + (target[2] - start[2]) * eased;
      const curH = start[3] + (target[3] - start[3]) * eased;

      this.currentViewBoxCoords.set([curX, curY, curW, curH]);

      if (progress < 1) {
        this.animFrameId = requestAnimationFrame(step);
      } else {
        this.currentViewBoxCoords.set(target);
        this.animFrameId = null;
        this.isZooming.set(false);
        this.highResImageUrl.set(null);
      }
    };

    this.animFrameId = requestAnimationFrame(step);
  }

  private animFrameId: number | null = null;

  /**
   * Calculates the target SVG viewBox coordinates dynamically based on the
   * country's true geographic boundaries and dimensions.
   * Ensures the entire country is comfortably visible with ~20-25% padding,
   * without cropping or excessive over-zooming.
   */
  public getCountryTargetViewBox(marker: DestinationMarker): [number, number, number, number] {
    const isMobile = this.isMobileView();
    const code = (marker.countryCode || '').trim().toUpperCase();
    const cacheKey = `${code}_${isMobile ? 'm' : 'd'}`;
    if (code && this.countryTargetViewBoxCache.has(cacheKey)) {
      return this.countryTargetViewBoxCache.get(cacheKey)!;
    }

    const world = this.worldViewBoxCoords();
    const worldW = world[2];
    const worldH = world[3];
    const aspect = worldW / worldH;

    const ext = getCountryExtent(code);
    let cx = marker.x;
    let cy = marker.y;
    let countryW = 50;
    let countryH = 40;

    if (ext && ext.width > 0 && ext.height > 0) {
      cx = ext.cx;
      cy = ext.cy;
      countryW = ext.width;
      countryH = ext.height;
    }

    // Consistent cartographic framing with 20-25% margin padding factor (1.45 multiplier)
    const paddingFactor = 1.45;
    const fitW = countryW * paddingFactor;
    const fitH_as_W = countryH * paddingFactor * aspect;

    // Minimum width clamp (110 on desktop, 120 on mobile) prevents over-zooming into micro-states
    // Maximum width clamp is worldW (never zoom out past full world view)
    const minW = isMobile ? 120 : 110;
    const targetW = Math.round(Math.min(Math.max(fitW, fitH_as_W, minW), worldW) * 10) / 10;
    const targetH = Math.round((targetW / aspect) * 10) / 10;

    // Center camera on country's true centroid
    const targetX = Math.round((cx - targetW / 2) * 10) / 10;
    let targetY = Math.round((cy - targetH / 2) * 10) / 10;

    // Keep camera within natural world bounds so northern coastlines don't protrude into void
    const minAllowedY = Math.max(30, world[1]);
    if (targetY < minAllowedY) {
      targetY = minAllowedY;
    }
    const maxAllowedY = Math.round((world[1] + worldH - targetH) * 10) / 10;
    if (targetY > maxAllowedY && maxAllowedY >= minAllowedY) {
      targetY = maxAllowedY;
    }

    const result: [number, number, number, number] = [targetX, targetY, targetW, targetH];
    if (code) {
      this.countryTargetViewBoxCache.set(cacheKey, result);
    }
    return result;
  }

  /**
   * Smoothly animates the SVG camera/viewBox from the current position
   * to the selected country using cubic easing.
   */
  public animateToCountry(marker: DestinationMarker, duration: number = 950): void {
    const target = this.getCountryTargetViewBox(marker);
    this.targetViewBoxCoords.set(target);

    if (!isPlatformBrowser(this.platformId) || typeof requestAnimationFrame === 'undefined' || duration === 0) {
      this.currentViewBoxCoords.set(target);
      this.isZooming.set(false);
      return;
    }

    // Cancel any existing in-flight animation frame so rapid clicks transition smoothly
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    const start = [...(this.currentViewBoxCoords() ?? this.worldViewBoxCoords())] as [number, number, number, number];
    this.currentViewBoxCoords.set(start);
    const startTime = performance.now();
    this.isZooming.set(true);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeInOutCubic(progress);

      const curX = start[0] + (target[0] - start[0]) * eased;
      const curY = start[1] + (target[1] - start[1]) * eased;
      const curW = start[2] + (target[2] - start[2]) * eased;
      const curH = start[3] + (target[3] - start[3]) * eased;

      this.currentViewBoxCoords.set([curX, curY, curW, curH]);

      if (progress < 1) {
        this.animFrameId = requestAnimationFrame(step);
      } else {
        this.currentViewBoxCoords.set(target);
        this.animFrameId = null;
        this.isZooming.set(false);
      }
    };

    this.animFrameId = requestAnimationFrame(step);
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  public onMarkerHover(countryCode: string | null): void {
    const clean = countryCode ? countryCode.toUpperCase() : null;
    this.hoveredCountryCode.set(clean);
    if (clean) {
      this.prefetchSatelliteImageForCountry(clean);
    }
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

  public onUniversityHover(uni: UniversityMarker | null): void {
    this.hoveredUniversity.set(uni);
  }

  public onUniversityClick(uni: UniversityMarker, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.selectedUniversity()?.id === uni.id) {
      this.selectedUniversity.set(null);
    } else {
      this.selectedUniversity.set(uni);
    }
  }

  public clearUniversitySelection(): void {
    this.selectedUniversity.set(null);
    this.hoveredUniversity.set(null);
  }

  public getUniTooltipWidth(name: string): number {
    const len = (name || '').length;
    const baseCharW = 2.4 * this.markerScaleFactor();
    return Math.max(28 * this.markerScaleFactor(), len * baseCharW + 8 * this.markerScaleFactor());
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
