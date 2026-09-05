import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { DestinationsMap } from './destinations-map';
import { CseService } from '../../../../../shared/services/cse.service';
import { AdminCountry, GroupedCountryUniversities } from '../../../../../shared/models/admin-university.model';

describe('DestinationsMap Component - API-Driven Dynamic Medical Atlas', () => {
  let component: DestinationsMap;
  let fixture: ComponentFixture<DestinationsMap>;

  const mockAdminCountries: AdminCountry[] = [
    { _id: 'c_ge', name: 'Georgia', slug: 'georgia', country_code: 'GE', status: 'ACTIVE', display_order: 1 },
    { _id: 'c_hu', name: 'Hungary', slug: 'hungary', country_code: 'HU', status: 'ACTIVE', display_order: 2 },
    { _id: 'c_gb', name: 'United Kingdom', slug: 'united-kingdom', country_code: 'GB', status: 'ACTIVE', display_order: 3 },
    { _id: 'c_kz', name: 'Kazakhstan', slug: 'kazakhstan', country_code: 'KZ', status: 'ACTIVE', display_order: 4 },
    { _id: 'c_inact', name: 'Inactive Land', slug: 'inactive', country_code: 'IL', status: 'INACTIVE', display_order: 5 }
  ];

  const mockGroupedUniversities: GroupedCountryUniversities[] = [
    {
      countryId: 'c_ge',
      countryName: 'Georgia',
      countryCode: 'GE',
      displayOrder: 1,
      universities: [
        { _id: 'u_ge1', country_id: 'c_ge', name: 'Tbilisi State Medical University', short_name: 'TSMU', status: 'ACTIVE' },
        { _id: 'u_ge2', country_id: 'c_ge', name: 'Batumi Shota Rustaveli State University', short_name: 'BSU', status: 'ACTIVE' },
      ]
    },
    {
      countryId: 'c_hu',
      countryName: 'Hungary',
      countryCode: 'HU',
      displayOrder: 2,
      universities: [
        { _id: 'u_hu1', country_id: 'c_hu', name: 'Semmelweis University', short_name: 'Semmelweis', status: 'ACTIVE' }
      ]
    },
    {
      countryId: 'c_gb',
      countryName: 'United Kingdom',
      countryCode: 'GB',
      displayOrder: 3,
      universities: [
        { _id: 'u_gb1', country_id: 'c_gb', name: 'King\'s College London', short_name: 'KCL', status: 'ACTIVE' },
        { _id: 'u_gb2', country_id: 'c_gb', name: 'University of Edinburgh', short_name: 'Edinburgh', status: 'ACTIVE' }
      ]
    },
    {
      countryId: 'c_kz',
      countryName: 'Kazakhstan',
      countryCode: 'KZ',
      displayOrder: 4,
      universities: [
        { _id: 'u_kz1', country_id: 'c_kz', name: 'Kazakh National Medical University', short_name: 'KazNMU', status: 'ACTIVE' }
      ]
    }
  ];

  let mockCseService: any;

  beforeEach(async () => {
    mockCseService = {
      getAdminCountriesResponse: vi.fn().mockReturnValue(of({
        status: 'success',
        count: 4,
        data: mockAdminCountries
      }))
    };

    await TestBed.configureTestingModule({
      imports: [DestinationsMap],
      providers: [
        provideRouter([]),
        { provide: CseService, useValue: mockCseService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DestinationsMap);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('groupedUniversities', mockGroupedUniversities);
    fixture.detectChanges();
  });

  it('should create DestinationsMap component and call Countries API', () => {
    expect(component).toBeTruthy();
    expect(mockCseService.getAdminCountriesResponse).toHaveBeenCalled();
  });

  it('should consume Countries API response, filter for status ACTIVE, and respect display_order', () => {
    const active = component.activeCountries();
    expect(active.length).toBe(4);
    expect(active.map(c => c.country_code)).toEqual(['GE', 'HU', 'GB', 'KZ']);
    expect(active.some(c => c.status === 'INACTIVE')).toBe(false);
  });

  it('should calculate dynamic destination count from API count or active countries array', () => {
    expect(component.totalDestinationsCount()).toBe(4);
    expect(component.totalUniversitiesCount()).toBe(6);
  });

  it('should dynamically render country names in uppercase directly from country.name', () => {
    const markerLabels = fixture.debugElement.queryAll(By.css('.marker-label'));
    const labelTexts = markerLabels.map(l => l.nativeElement.textContent.trim());

    expect(labelTexts).toContain('GEORGIA');
    expect(labelTexts).toContain('HUNGARY');
    expect(labelTexts).toContain('UNITED KINGDOM');
    expect(labelTexts).toContain('KAZAKHSTAN');
  });

  it('should match university counts dynamically per country from Universities data', () => {
    const activeMarker = fixture.debugElement.query(By.css('.destination-node.is-active'));
    expect(activeMarker).toBeTruthy();
    expect(activeMarker.nativeElement.textContent).toContain('GEORGIA');
    expect(activeMarker.nativeElement.textContent).toContain('2 UNIVERSITIES');
  });

  it('should completely omit the route line (no route-arc or animated travel path)', () => {
    const routeArc = fixture.debugElement.query(By.css('.route-arc'));
    expect(routeArc).toBeNull();
  });

  it('should omit India origin marker if India is not in Countries API response', () => {
    const origin = fixture.debugElement.query(By.css('.origin-node'));
    expect(origin).toBeNull();
  });

  it('should dynamically render India origin marker if India is present in Countries API response', () => {
    const countriesWithIndia: AdminCountry[] = [
      ...mockAdminCountries,
      { _id: 'c_in', name: 'India', slug: 'india', country_code: 'IN', status: 'ACTIVE', display_order: 99 }
    ];
    fixture.componentRef.setInput('customCountries', countriesWithIndia);
    fixture.detectChanges();

    const origin = fixture.debugElement.query(By.css('.origin-node'));
    expect(origin).toBeTruthy();
    expect(origin.nativeElement.textContent).toContain('INDIA');
    expect(origin.nativeElement.textContent).toContain('ORIGIN');
  });

  it('should gracefully skip countries without coordinates with a console warning', () => {
    vi.spyOn(console, 'warn');
    const countriesWithUnknown: AdminCountry[] = [
      ...mockAdminCountries,
      { _id: 'c_xx', name: 'Atlantis', slug: 'atlantis', country_code: 'XX', status: 'ACTIVE', display_order: 100 }
    ];
    fixture.componentRef.setInput('customCountries', countriesWithUnknown);
    fixture.detectChanges();

    const markers = component.activeCountryMarkers();
    expect(markers.length).toBe(4);
    expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/No coordinate mapping found/));
  });

  it('should update active destination when user clicks a marker', () => {
    component.selectDestination('HU');
    fixture.detectChanges();

    const active = component.activeDestination();
    expect(active).toBeTruthy();
    expect(active!.countryCode).toBe('HU');
    expect(active!.countryName).toBe('Hungary');

    const activeMarker = fixture.debugElement.query(By.css('.destination-node.is-active'));
    expect(activeMarker.nativeElement.textContent).toContain('HUNGARY');
    expect(activeMarker.nativeElement.textContent).toContain('1 UNIVERSITIES');
  });

  it('should provide accessible screen-reader directory with dynamic destination count and links', () => {
    const srItems = fixture.debugElement.queryAll(By.css('.sr-only li'));
    expect(srItems.length).toBe(4);
    expect(srItems[0].nativeElement.textContent).toContain('Georgia');

    const srLinks = fixture.debugElement.queryAll(By.css('.sr-only a'));
    expect(srLinks.length).toBe(4);
    expect(srLinks[0].nativeElement.getAttribute('href')).toContain('/auth/register');
  });

  it('should provide responsive SVG viewBox based on viewport and preserveAspectRatio slice', () => {
    const svg = fixture.debugElement.query(By.css('.atlas-svg'));
    expect(svg.nativeElement.getAttribute('preserveAspectRatio')).toBe('xMidYMid slice');

    // Desktop default
    component.isMobileView.set(false);
    component.viewportWidth.set(1440);
    expect(component.mapViewBox()).toBe('110 30 840 395');

    // Mobile viewport
    component.isMobileView.set(true);
    expect(component.mapViewBox()).toBe('470 10 360 420');
  });
});
