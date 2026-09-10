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
    city: 'Tbilisi',
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
    expect(component.activeCountryMarkers().map((c) => c.countryName)).toEqual(
      countries.map((c) => c.name),
    );
    expect(component.totalDestinationsCount()).toBe(5);
    expect(component.totalUniversitiesCount()).toBe(5);
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
  it.each(['KZ', 'RU', 'GE', 'HU', 'AU'])(
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
});
