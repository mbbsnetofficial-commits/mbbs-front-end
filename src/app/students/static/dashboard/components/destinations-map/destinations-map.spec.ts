import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DestinationsMap } from './destinations-map';
import { CseService } from '../../../../../shared/services/cse.service';
import { AdminCountry, AdminUniversity } from '../../../../../shared/models/admin-university.model';
import {
  angularDistance,
  countryFrame,
  earthPosition,
  exactCoordinates,
  focusDistance,
  satelliteUrl,
} from './globe-geography';
import { resolveUniversityCoordinates } from './destinations-geo.data';
import {
  INDIA_FALLBACK_COUNTRY,
  INDIA_FALLBACK_UNIVERSITIES,
} from './india-destination.data';
import {
  VERIFIED_UNIVERSITY_LOCATIONS,
  verifiedUniversityLocation,
} from './verified-university-locations.data';

const countries: AdminCountry[] = [
  ['KZ', 'Kazakhstan'],
  ['RU', 'Russia'],
  ['GE', 'Georgia'],
  ['HU', 'Hungary'],
  ['AU', 'Australia'],
].map(([code, name], i) => ({
  _id: code,
  country_code: code,
  name,
  slug: name.toLowerCase(),
  status: 'ACTIVE',
  display_order: i,
}));
const universities: AdminUniversity[] = [
  {
    _id: 'ge1',
    country_id: 'GE',
    name: 'Tbilisi State Medical University',
    city: 'Tbilisi',
    status: 'ACTIVE',
    latitude: 41.745,
    longitude: 44.775,
    official_website: 'https://tsmu.edu',
    type: 'PUBLIC',
  },
  {
    _id: 'ge2',
    country_id: 'GE',
    name: 'University without coordinates',
    status: 'ACTIVE',
  },
  {
    _id: 'ge3',
    country_id: 'GE',
    name: 'University at same coordinates',
    status: 'ACTIVE',
    latitude: 41.745,
    longitude: 44.775,
  },
  {
    _id: 'hu1',
    country_id: 'HU',
    name: 'Hungarian University',
    status: 'ACTIVE',
    lat: 47.49,
    lng: 19.05,
  },
  {
    _id: 'au1',
    country_id: 'AU',
    name: 'Invalid coordinates',
    status: 'ACTIVE',
    latitude: -110,
    longitude: 200,
  },
  {
    _id: 'ge4',
    country_id: 'GE',
    name: 'Inactive university',
    status: 'INACTIVE',
    latitude: 42,
    longitude: 44,
  },
];

describe('Destinations explorer', () => {
  let fixture: ComponentFixture<DestinationsMap>;
  let component: DestinationsMap;
  beforeEach(async () => {
    (DestinationsMap as any).ɵcmp.inputs = {
      customCountries: ['customCountries', 1, null],
      groupedUniversities: ['groupedUniversities', 1, null],
      loading: ['loading', 1, null],
    };
    await TestBed.configureTestingModule({
      imports: [DestinationsMap],
      providers: [
        provideRouter([]),
        {
          provide: CseService,
          useValue: {
            getAdminCountriesResponse: vi.fn(() => of({ data: countries, count: 5 })),
            getAdminUniversities: vi.fn(() => of(universities)),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DestinationsMap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('keeps API ordering, counts, country names, and university records', () => {
    expect(component.activeCountryMarkers().map((c) => c.countryName)).toEqual([
      ...countries.map((c) => c.name),
      'India',
    ]);
    expect(component.totalDestinationsCount()).toBe(6);
    expect(component.totalUniversitiesCount()).toBe(15);
    component.selectDestination('GE');
    expect(component.selectedCountry()?.universityCount).toBe(3);
  });
  it.each(['KZ', 'RU', 'GE', 'HU', 'AU'])(
    'selects %s from an accessible control and returns to world',
    (code) => {
      const picker = fixture.nativeElement.querySelector('#destination-picker');
      picker.value = code;
      picker.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(component.activeCountryCode()).toBe(code);
      expect(fixture.nativeElement.querySelector('.explorer-country-title').textContent).toContain(
        countries.find((c) => c.country_code === code)!.name,
      );
      fixture.nativeElement.querySelector('.btn-back-to-world').click();
      fixture.detectChanges();
      expect(component.selectedCountry()).toBeNull();
      expect(component.isWorldView()).toBe(true);
    },
  );
  it('only plots exact coordinates and never substitutes city or country centres', () => {
    component.selectDestination('Georgia');
    expect(component.activeCountryUniversities().map((u) => u.id)).toEqual(['ge1', 'ge3']);
    expect(component.activeCountryUniversities()[0].lat).toBe(41.745);
    expect(component.activeCountryUniversities()[0].lng).toBe(44.775);
    expect(component.activeCountryUniversities()[0].lat).toBe(
      component.activeCountryUniversities()[1].lat,
    );
    expect(component.unmappedCount()).toBe(1);
    component.selectDestination('AU');
    expect(component.activeCountryUniversities()).toEqual([]);
  });
  it('supports lat/lng aliases and preserves every university in the directory', () => {
    component.selectDestination('HU');
    expect(component.activeCountryUniversities()[0].lat).toBe(47.49);
    component.selectDestination('GE');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('#university-picker option').length).toBe(4);
    expect(fixture.nativeElement.querySelector('.location-note').textContent).toContain(
      'Some campus locations',
    );
  });
  it('shows API university details, location, type and official website on directory selection', () => {
    component.selectDestination('GE');
    fixture.detectChanges();
    const picker = fixture.nativeElement.querySelector('#university-picker');
    picker.value = 'ge1';
    picker.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('.university-detail-card');
    expect(card.textContent).toContain('Tbilisi State Medical University');
    expect(card.textContent).toContain('Tbilisi, Georgia');
    expect(card.querySelector('a').getAttribute('href')).toBe('https://tsmu.edu');
    fixture.nativeElement.querySelector('.card-close').click();
    fixture.detectChanges();
    expect(component.activeUniversity()).toBeNull();
  });
  it('uses verified Turkey campus coordinates when API records do not provide exact coordinates', () => {
    fixture.componentRef.setInput('customCountries', [
      {
        _id: 'TR',
        country_code: 'TR',
        name: 'Turkey',
        slug: 'turkey',
        status: 'ACTIVE',
        display_order: 0,
      },
    ]);
    component.internalUniversities.set([
      {
        _id: 'tr1',
        country_id: 'TR',
        name: 'Ankara University',
        city: 'Ankara',
        status: 'ACTIVE',
        official_website: 'https://www.ankara.edu.tr',
      },
      {
        _id: 'tr2',
        country_id: 'TR',
        name: 'Koç University',
        city: 'Istanbul',
        status: 'ACTIVE',
      },
      {
        _id: 'tr3',
        country_id: 'TR',
        name: 'Hacettepe University',
        status: 'ACTIVE',
      },
      {
        _id: 'tr4',
        country_id: 'TR',
        name: 'Istanbul University-Cerrahpaşa',
        status: 'ACTIVE',
      },
      {
        _id: 'tr5',
        country_id: 'TR',
        name: 'Acıbadem Mehmet Ali Aydınlar University',
        status: 'ACTIVE',
      },
    ]);
    component.selectDestination('TR');
    fixture.detectChanges();
    expect(component.activeCountryUniversities().map((u) => u.id)).toEqual([
      'tr1',
      'tr2',
      'tr3',
      'tr4',
      'tr5',
    ]);
    expect(component.activeCountryUniversities()[0]).toMatchObject({
      city: 'Ankara',
      coordinateSource: 'verified',
      lat: 39.93000831907095,
      lng: 32.85866413122493,
    });
    expect(component.unmappedCount()).toBe(0);
  });
  it('keeps API coordinates ahead of verified fallback and focuses selected university coordinates', () => {
    fixture.componentRef.setInput('customCountries', [
      {
        _id: 'TR',
        country_code: 'TR',
        name: 'Turkey',
        slug: 'turkey',
        status: 'ACTIVE',
        display_order: 0,
      },
    ]);
    component.internalUniversities.set([
      {
        _id: 'tr1',
        country_id: 'TR',
        name: 'Ankara University',
        city: 'Ankara',
        status: 'ACTIVE',
        latitude: 39.95,
        longitude: 32.84,
      },
    ]);
    const focusLocation = vi.fn();
    (
      component as unknown as {
        globe: {
          focusLocation: typeof focusLocation;
          setAnchors: ReturnType<typeof vi.fn>;
          dispose: ReturnType<typeof vi.fn>;
        };
      }
    ).globe = {
      focusLocation,
      setAnchors: vi.fn(),
      dispose: vi.fn(),
    };
    component.selectDestination('TR');
    component.selectUniversity('tr1');
    fixture.detectChanges();
    expect(component.activeCountryUniversities()[0]).toMatchObject({
      coordinateSource: 'api',
      lat: 39.95,
      lng: 32.84,
    });
    expect(focusLocation).toHaveBeenCalledWith({ lat: 39.95, lng: 32.84 });
    expect(fixture.nativeElement.querySelector('.coordinate-source').textContent).toContain(
      'MBBS.NET API coordinates',
    );
  });
  it('supports marker hover/click and clears details between countries and on reset', () => {
    component.selectDestination('GE');
    component.hoveredUniversityId.set('ge1');
    expect(component.activeUniversity()?.name).toContain('Tbilisi');
    component.onAnchorClick({
      id: 'ge1',
      kind: 'university',
      label: 'Tbilisi',
      lat: 41.745,
      lng: 44.775,
    });
    expect(component.selectedUniversityId()).toBe('ge1');
    component.selectDestination('HU');
    expect(component.activeUniversity()).toBeNull();
    component.resetToWorldView();
    expect(component.activeCountryUniversities()).toEqual([]);
  });
  it('updates selected country when university data arrives after selection without mutating inputs', () => {
    component.internalUniversities.set([]);
    component.selectDestination('GE');
    expect(component.selectedCountry()?.universityCount).toBe(0);
    const group = Object.freeze({
      countryId: 'GE',
      countryCode: 'GE',
      countryName: 'Georgia',
      displayOrder: 0,
      universities: Object.freeze([universities[0]]),
    });
    fixture.componentRef.setInput('groupedUniversities', [group]);
    fixture.detectChanges();
    component.internalUniversities.set(universities);
    expect(component.selectedCountry()?.universityCount).toBe(3);
    expect(group.universities.length).toBe(1);
  });
  it('preserves registration route and destination query parameter', () => {
    component.selectDestination('GE');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.explore-link').getAttribute('href')).toBe(
      '/auth/register?destination=Georgia',
    );
    expect(component.officialWebsite('javascript:alert(1)')).toBeNull();
  });
  it('retains accessible data when WebGL is unavailable without reintroducing a flat map', () => {
    component.showUnavailable();
    component.selectDestination('GE');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.unavailable-message').textContent).toContain(
      '3D view is unavailable',
    );
    expect(fixture.nativeElement.querySelector('.selected-country-highlight')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.fallback-country-hit').length).toBe(0);
    expect(fixture.nativeElement.querySelector('#university-picker')).toBeTruthy();
    expect(component.isZooming()).toBe(false);
    component.resetToWorldView();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('svg image').length).toBe(0);
    expect(fixture.nativeElement.textContent).not.toContain('Atlas');
  });
  it('uses an intentional loading state independently of API availability', () => {
    component.renderState.set('loading');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.world-loading').textContent).toContain(
      'Loading the world',
    );
    expect(fixture.nativeElement.querySelector('.globe-stage').classList.contains('is-ready')).toBe(
      false,
    );
  });
  it('handles empty countries without fabricating destinations', () => {
    fixture.componentRef.setInput('customCountries', []);
    fixture.detectChanges();
    expect(component.activeCountryMarkers()).toEqual([]);
    expect(fixture.nativeElement.querySelector('select').disabled).toBe(true);
  });
  it('enforces 3-tier coordinate priority: API > verified campus > verified city', () => {
    // 1. API coordinates override verified campus and city
    fixture.componentRef.setInput('customCountries', [
      {
        _id: 'TR',
        country_code: 'TR',
        name: 'Turkey',
        slug: 'turkey',
        status: 'ACTIVE',
        display_order: 0,
      },
    ]);
    component.internalUniversities.set([
      {
        _id: 'tr_priority_1',
        country_id: 'TR',
        name: 'Hacettepe University',
        city: 'Ankara',
        status: 'ACTIVE',
        latitude: 39.99,
        longitude: 32.99,
      },
      {
        _id: 'tr_priority_2',
        country_id: 'TR',
        name: 'Hacettepe University',
        city: 'Ankara',
        status: 'ACTIVE',
      },
      {
        _id: 'tr_priority_3',
        country_id: 'TR',
        name: 'Unverified Medicine College',
        city: 'Bordeaux',
        status: 'ACTIVE',
      },
    ]);
    component.selectDestination('TR');
    fixture.detectChanges();

    const unis = component.activeCountryUniversities();
    expect(unis.length).toBe(3);

    // University 1: has API coords -> uses API (not verified or city)
    expect(unis[0].coordinateSource).toBe('api');
    expect(unis[0].lat).toBe(39.99);
    expect(unis[0].lng).toBe(32.99);

    // University 2: no API coords, matching verified campus -> uses verified campus
    expect(unis[1].coordinateSource).toBe('verified');
    expect(unis[1].lat).toBeCloseTo(39.93179, 4);
    expect(unis[1].lng).toBeCloseTo(32.86268, 4);

    // University 3: no API coords, unverified name, known city -> uses verified city coords
    expect(unis[2].coordinateSource).toBe('city');
    expect(unis[2].lat).toBeCloseTo(44.8378, 3);
    expect(unis[2].lng).toBeCloseTo(-0.5792, 3);
  });
  it('clears old markers, selected university, and detail card immediately when switching countries', () => {
    component.selectDestination('Georgia');
    fixture.detectChanges();
    component.selectUniversity('ge1');
    fixture.detectChanges();

    expect(component.selectedUniversityId()).toBe('ge1');
    expect(component.activeUniversityMarker()?.id).toBe('ge1');
    expect(fixture.nativeElement.querySelector('.university-detail-card')).toBeTruthy();

    // Switch from Georgia to Hungary
    component.selectDestination('HU');
    fixture.detectChanges();

    // Old university selection and card must be completely cleared
    expect(component.selectedUniversityId()).toBe('');
    expect(component.activeUniversity()).toBeNull();
    expect(component.activeUniversityMarker()).toBeNull();
    expect(fixture.nativeElement.querySelector('.university-detail-card')).toBeNull();

    // Markers must now belong only to Hungary
    expect(component.activeCountryUniversities().every((u) => u.countryName === 'Hungary')).toBe(true);
    expect(component.activeCountryUniversities().some((u) => u.id === 'ge1')).toBe(false);
  });
});

describe('Earth geographic correctness', () => {
  it('maps cardinal coordinates to the equirectangular sphere without mirrored longitude', () => {
    expect(earthPosition(0, 0)).toEqual([1, 0, -0]);
    expect(earthPosition(90, 0)[1]).toBeCloseTo(1);
    expect(earthPosition(0, 90)[2]).toBeCloseTo(-1);
    expect(earthPosition(0, -90)[2]).toBeCloseTo(1);
    expect(earthPosition(0, 180)[0]).toBeCloseTo(-1);
  });
  it('rejects missing, nonfinite and out-of-range coordinates while accepting zero', () => {
    for (const pair of [
      [undefined, 12],
      [NaN, 5],
      [Infinity, 4],
      [91, 20],
      [10, -181],
      ['', '44'],
      ['  ', '44'],
      [null, 44],
      [true, 44],
      ['42north', '44'],
      ['0x12', '44'],
    ])
      expect(exactCoordinates(...(pair as [unknown, unknown]))).toBeNull();
    expect(exactCoordinates(0, 0)).toEqual({ lat: 0, lng: 0 });
    expect(exactCoordinates(' 43.2389 ', '+76.8897')).toEqual({ lat: 43.2389, lng: 76.8897 });
    expect(exactCoordinates('-33.8886', '151.1873')).toEqual({ lat: -33.8886, lng: 151.1873 });
  });
  it.each(['KZ', 'RU', 'GE', 'HU', 'AU', 'IN'])(
    'frames the real %s mainland and generates geographic terrain bounds',
    (code) => {
      const frame = countryFrame(code);
      expect(frame.bounds[0]).toBeLessThan(frame.lng);
      expect(frame.bounds[2]).toBeGreaterThan(frame.lng);
      expect(frame.bounds[1]).toBeLessThan(frame.lat);
      expect(frame.bounds[3]).toBeGreaterThan(frame.lat);
      expect(focusDistance(frame.radius, 34, 1.8)).toBeGreaterThan(1.2);
      expect(satelliteUrl(frame.bounds)).toContain('imageSR=4326');
      expect(satelliteUrl(frame.bounds)).toContain('adjustAspectRatio=false');
    },
  );
  it('keeps Australia in the southern hemisphere and Russia east of Europe', () => {
    expect(countryFrame('AU').lat).toBeLessThan(-20);
    expect(countryFrame('RU').lng).toBeGreaterThan(80);
    expect(countryFrame('GE').lng).toBeGreaterThan(40);
  });
  it('uses the short angular path across the antimeridian', () => {
    expect(angularDistance({ lat: 0, lng: 179 }, { lat: 0, lng: -179 })).toBeCloseTo(Math.PI / 90);
  });
  it('correctly maps Malta Victoria to Gozo and not Seychelles', () => {
    const maltaCoords = resolveUniversityCoordinates('Victoria', undefined, 'MT');
    expect(maltaCoords).not.toBeNull();
    // Malta coordinates: lat ~36.04, lng ~14.24 (NOT Seychelles lat -4.6, lng 55.4)
    expect(maltaCoords![0]).toBeCloseTo(14.2417, 3); // longitude
    expect(maltaCoords![1]).toBeCloseTo(36.0444, 3); // latitude
    expect(maltaCoords![1]).toBeGreaterThan(30);     // Must be in Mediterranean, Northern Hemisphere
  });
});

describe('India (IN) Destination Integration (Tests A through O)', () => {
  let fixture: ComponentFixture<DestinationsMap>;
  let component: DestinationsMap;

  beforeEach(async () => {
    (DestinationsMap as any).ɵcmp.inputs = {
      customCountries: ['customCountries', 1, null],
      groupedUniversities: ['groupedUniversities', 1, null],
      loading: ['loading', 1, null],
    };
    await TestBed.configureTestingModule({
      imports: [DestinationsMap],
      providers: [
        provideRouter([]),
        {
          provide: CseService,
          useValue: {
            getAdminCountriesResponse: vi.fn(() => of({ data: countries, count: 5 })),
            getAdminUniversities: vi.fn(() => of(universities)),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DestinationsMap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('A. India exists with countryCode = IN', () => {
    const indiaMarker = component.activeCountryMarkers().find((c) => c.countryCode === 'IN');
    expect(indiaMarker).toBeDefined();
    expect(indiaMarker?.countryCode).toBe('IN');
    expect(indiaMarker?.countryName).toBe('India');

    const indiaCountry = component.activeCountries().find((c) => c.country_code === 'IN');
    expect(indiaCountry).toBeDefined();
    expect(indiaCountry?.name).toBe('India');
  });

  it('B. India has exactly 10 institutions', () => {
    component.selectDestination('IN');
    fixture.detectChanges();
    expect(component.activeCountryUniversities().length).toBe(10);
    expect(INDIA_FALLBACK_UNIVERSITIES.length).toBe(10);
  });

  it('C. All 10 institutions belong to IN', () => {
    component.selectDestination('IN');
    fixture.detectChanges();
    const unis = component.activeCountryUniversities();
    expect(unis.length).toBe(10);
    expect(unis.every((u) => u.countryCode === 'IN')).toBe(true);
    expect(unis.every((u) => u.countryName === 'India')).toBe(true);
  });

  it('D. All 10 have valid latitude/longitude', () => {
    component.selectDestination('IN');
    fixture.detectChanges();
    const unis = component.activeCountryUniversities();
    expect(unis.length).toBe(10);
    for (const u of unis) {
      expect(typeof u.lat).toBe('number');
      expect(typeof u.lng).toBe('number');
      expect(isFinite(u.lat)).toBe(true);
      expect(isFinite(u.lng)).toBe(true);
      expect(isNaN(u.lat)).toBe(false);
      expect(isNaN(u.lng)).toBe(false);
    }
  });

  it('E. All 10 use campus-level verified coordinates and NIRF ranking metadata', () => {
    component.selectDestination('IN');
    fixture.detectChanges();
    const unis = component.activeCountryUniversities();
    expect(unis.length).toBe(10);
    for (const u of unis) {
      expect(u.coordinateSource).toBe('verified');
      const verified = verifiedUniversityLocation('IN', u.name);
      expect(verified).toBeDefined();
      expect(verified?.coordinateType).toBe('campus');
      expect(verified?.rankingSource).toBe('NIRF');
      expect(verified?.rankingCategory).toBe('Medical');
      expect(verified?.rankingYear).toBe(2024);
      expect(verified?.sourceUrl).toMatch(/^https?:\/\//);
    }
  });

  it('F. Coordinates are inside India expected geographic bounds', () => {
    component.selectDestination('IN');
    fixture.detectChanges();
    const unis = component.activeCountryUniversities();
    expect(unis.length).toBe(10);
    for (const u of unis) {
      expect(u.lat).toBeGreaterThanOrEqual(6.0);
      expect(u.lat).toBeLessThanOrEqual(38.0);
      expect(u.lng).toBeGreaterThanOrEqual(68.0);
      expect(u.lng).toBeLessThanOrEqual(98.0);
    }
  });

  it('G. India country selection works', () => {
    component.selectDestination('IN');
    fixture.detectChanges();
    expect(component.activeCountryCode()).toBe('IN');
    expect(component.selectedCountry()?.countryName).toBe('India');
    expect(component.isWorldView()).toBe(false);
    expect(component.isCountryView()).toBe(true);

    const titleEl = fixture.nativeElement.querySelector('.explorer-country-title');
    expect(titleEl?.textContent).toContain('India');
  });

  it('H. India university filtering works', () => {
    component.selectDestination('IN');
    fixture.detectChanges();
    const unis = component.activeCountryUniversities();
    expect(unis.length).toBe(10);
    expect(unis.some((u) => ['ge1', 'ge2', 'ge3', 'kz1', 'hu1'].includes(u.id))).toBe(false);
    expect(unis.every((u) => u.countryCode === 'IN')).toBe(true);
  });

  it('I. Selecting AIIMS New Delhi focuses on its campus coordinates', () => {
    component.selectDestination('IN');
    fixture.detectChanges();
    const aiims = component.activeCountryUniversities().find((u) => u.name.includes('AIIMS'))!;
    expect(aiims).toBeDefined();
    expect(aiims.lat).toBeCloseTo(28.5672, 3);
    expect(aiims.lng).toBeCloseTo(77.21, 3);

    component.selectUniversity(aiims.id);
    fixture.detectChanges();

    expect(component.activeUniversityMarker()?.id).toBe(aiims.id);
    expect(component.activeUniversityMarker()?.lat).toBeCloseTo(28.5672, 3);
    expect(component.activeUniversityMarker()?.lng).toBeCloseTo(77.21, 3);
    expect(component.activeUniversity()?.name).toContain('AIIMS New Delhi');

    const card = fixture.nativeElement.querySelector('.university-detail-card');
    expect(card).not.toBeNull();
    expect(card.textContent).toContain('AIIMS New Delhi');
    expect(card.textContent).toContain('New Delhi');
  });

  it('J. Selecting KMC Manipal focuses on its campus coordinates', () => {
    component.selectDestination('IN');
    fixture.detectChanges();
    const kmc = component.activeCountryUniversities().find((u) => u.name.includes('Kasturba'))!;
    expect(kmc).toBeDefined();
    expect(kmc.lat).toBeCloseTo(13.3533, 3);
    expect(kmc.lng).toBeCloseTo(74.7865, 3);

    component.selectUniversity(kmc.id);
    fixture.detectChanges();

    expect(component.activeUniversityMarker()?.id).toBe(kmc.id);
    expect(component.activeUniversityMarker()?.lat).toBeCloseTo(13.3533, 3);
    expect(component.activeUniversityMarker()?.lng).toBeCloseTo(74.7865, 3);
    expect(component.activeUniversity()?.name).toContain('Kasturba Medical College');
  });

  it('K. Both SGPGI and KGMU exist independently in Lucknow', () => {
    component.selectDestination('IN');
    fixture.detectChanges();
    const sgpgi = component.activeCountryUniversities().find((u) => u.name.includes('SGPGI'))!;
    const kgmu = component.activeCountryUniversities().find((u) => u.name.includes('King George'))!;

    expect(sgpgi).toBeDefined();
    expect(kgmu).toBeDefined();
    expect(sgpgi.id).not.toBe(kgmu.id);
    expect(sgpgi.city).toBe('Lucknow');
    expect(kgmu.city).toBe('Lucknow');

    expect(sgpgi.lat).not.toBe(kgmu.lat);
    expect(sgpgi.lng).not.toBe(kgmu.lng);
    const latDiff = Math.abs(sgpgi.lat - kgmu.lat);
    expect(latDiff).toBeGreaterThan(0.1);
  });

  it('L. WORLD MAP clears Indian markers/state', () => {
    component.selectDestination('IN');
    fixture.detectChanges();
    const aiims = component.activeCountryUniversities().find((u) => u.name.includes('AIIMS'))!;
    component.selectUniversity(aiims.id);
    fixture.detectChanges();

    expect(component.activeUniversity()).not.toBeNull();
    expect(component.activeUniversityMarker()).not.toBeNull();

    component.resetToWorldView();
    fixture.detectChanges();

    expect(component.activeCountryCode()).toBe('');
    expect(component.selectedCountry()).toBeNull();
    expect(component.activeUniversity()).toBeNull();
    expect(component.activeUniversityMarker()).toBeNull();
    expect(component.isWorldView()).toBe(true);
    expect(fixture.nativeElement.querySelector('.university-detail-card')).toBeNull();
  });

  it('M. API data without India triggers the India fallback', () => {
    expect(countries.some((c) => c.country_code === 'IN')).toBe(false);
    expect(component.activeCountries().some((c) => c.country_code === 'IN')).toBe(true);
    expect(component.activeCountryMarkers().some((c) => c.countryCode === 'IN')).toBe(true);
  });

  it('N. API data containing India does NOT create duplicate India', () => {
    const apiWithIndia: AdminCountry[] = [
      ...countries,
      {
        _id: 'IN-API',
        country_code: 'IN',
        name: 'India',
        slug: 'india',
        status: 'ACTIVE',
        display_order: 99,
      },
    ];
    fixture.componentRef.setInput('customCountries', apiWithIndia);
    fixture.detectChanges();

    const inMarkers = component.activeCountryMarkers().filter((c) => c.countryCode === 'IN');
    expect(inMarkers.length).toBe(1);

    const inCountries = component.activeCountries().filter((c) => c.country_code === 'IN');
    expect(inCountries.length).toBe(1);
  });

  it('O. Repeated country switching does not duplicate institutions', () => {
    component.selectDestination('IN');
    fixture.detectChanges();
    expect(component.activeCountryUniversities().length).toBe(10);

    component.resetToWorldView();
    fixture.detectChanges();
    expect(component.isWorldView()).toBe(true);

    component.selectDestination('GE');
    fixture.detectChanges();
    expect(component.activeCountryUniversities().length).toBe(2);

    component.selectDestination('IN');
    fixture.detectChanges();
    expect(component.activeCountryUniversities().length).toBe(10);

    component.resetToWorldView();
    fixture.detectChanges();

    component.selectDestination('IN');
    fixture.detectChanges();
    const unis = component.activeCountryUniversities();
    expect(unis.length).toBe(10);

    const uniqueIds = new Set(unis.map((u) => u.id));
    expect(uniqueIds.size).toBe(10);
  });
});

