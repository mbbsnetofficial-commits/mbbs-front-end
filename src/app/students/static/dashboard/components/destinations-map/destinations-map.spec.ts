import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { DestinationsMap } from './destinations-map';
import { projectCoordinates, unprojectCoordinates, getCountryGeoBBox } from './destinations-geo.data';
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
    { _id: 'c_ru', name: 'Russia', slug: 'russia', country_code: 'RU', status: 'ACTIVE', display_order: 5 },
    { _id: 'c_au', name: 'Australia', slug: 'australia', country_code: 'AU', status: 'ACTIVE', display_order: 6 },
    { _id: 'c_inact', name: 'Inactive Land', slug: 'inactive', country_code: 'IL', status: 'INACTIVE', display_order: 7 }
  ];

  const mockGroupedUniversities: GroupedCountryUniversities[] = [
    {
      countryId: 'c_ge',
      countryName: 'Georgia',
      countryCode: 'GE',
      displayOrder: 1,
      universities: [
        { _id: 'u_ge1', country_id: 'c_ge', name: 'Tbilisi State Medical University', short_name: 'TSMU', status: 'ACTIVE', locations: [{ state: 'Tbilisi', cities: ['Tbilisi'] }], official_website: 'https://tsmu.edu' },
        { _id: 'u_ge2', country_id: 'c_ge', name: 'Batumi Shota Rustaveli State University', short_name: 'BSU', status: 'ACTIVE', locations: [{ state: 'Adjara', cities: ['Batumi'] }] },
      ]
    },
    {
      countryId: 'c_hu',
      countryName: 'Hungary',
      countryCode: 'HU',
      displayOrder: 2,
      universities: [
        { _id: 'u_hu1', country_id: 'c_hu', name: 'Semmelweis University', short_name: 'Semmelweis', status: 'ACTIVE', city: 'Budapest', official_website: 'https://semmelweis.hu' }
      ]
    },
    {
      countryId: 'c_gb',
      countryName: 'United Kingdom',
      countryCode: 'GB',
      displayOrder: 3,
      universities: [
        { _id: 'u_gb1', country_id: 'c_gb', name: 'King\'s College London', short_name: 'KCL', status: 'ACTIVE', city: 'London' },
        { _id: 'u_gb2', country_id: 'c_gb', name: 'University of Edinburgh', short_name: 'Edinburgh', status: 'ACTIVE', city: 'Edinburgh' }
      ]
    },
    {
      countryId: 'c_kz',
      countryName: 'Kazakhstan',
      countryCode: 'KZ',
      displayOrder: 4,
      universities: [
        { _id: 'u_kz1', country_id: 'c_kz', name: 'Kazakh National Medical University', short_name: 'KazNMU', status: 'ACTIVE', locations: [{ state: 'Almaty', cities: ['Almaty'] }] },
        { _id: 'u_kz2', country_id: 'c_kz', name: 'Astana Medical University', short_name: 'AMU', status: 'ACTIVE', locations: [{ state: 'Astana', cities: ['Astana'] }] },
        { _id: 'u_kz_unmapped', country_id: 'c_kz', name: 'Unknown University No Coords', short_name: 'UUNC', status: 'ACTIVE' }
      ]
    },
    {
      countryId: 'c_ru',
      countryName: 'Russia',
      countryCode: 'RU',
      displayOrder: 5,
      universities: [
        { _id: 'u_ru1', country_id: 'c_ru', name: 'Sechenov University', short_name: 'Sechenov', status: 'ACTIVE', city: 'Moscow' },
        { _id: 'u_ru2', country_id: 'c_ru', name: 'Pavlov First Saint Petersburg State Medical University', short_name: 'Pavlov', status: 'ACTIVE', city: 'Saint Petersburg' }
      ]
    },
    {
      countryId: 'c_au',
      countryName: 'Australia',
      countryCode: 'AU',
      displayOrder: 6,
      universities: [
        { _id: 'u_au1', country_id: 'c_au', name: 'University of Melbourne', short_name: 'UniMelb', status: 'ACTIVE', city: 'Melbourne' },
        { _id: 'u_au2', country_id: 'c_au', name: 'University of Sydney', short_name: 'USYD', status: 'ACTIVE', city: 'Sydney' }
      ]
    }
  ];

  let mockCseService: any;

  beforeEach(async () => {
    mockCseService = {
      getAdminCountriesResponse: vi.fn().mockReturnValue(of({
        status: 'success',
        count: 6,
        data: mockAdminCountries
      })),
      getAdminUniversities: vi.fn().mockReturnValue(of([]))
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
    expect(active.length).toBe(6);
    expect(active.map(c => c.country_code)).toEqual(['GE', 'HU', 'GB', 'KZ', 'RU', 'AU']);
    expect(active.some(c => c.status === 'INACTIVE')).toBe(false);
  });

  it('should calculate dynamic destination count from API count or active countries array', () => {
    expect(component.totalDestinationsCount()).toBe(6);
    expect(component.totalUniversitiesCount()).toBe(12);
  });

  it('should dynamically render country names in uppercase directly from country.name', () => {
    const markerLabels = fixture.debugElement.queryAll(By.css('.marker-label'));
    const labelTexts = markerLabels.map(l => l.nativeElement.textContent.trim());

    expect(labelTexts).toContain('GEORGIA');
    expect(labelTexts).toContain('HUNGARY');
    expect(labelTexts).toContain('UNITED KINGDOM');
    expect(labelTexts).toContain('KAZAKHSTAN');
    expect(labelTexts).toContain('RUSSIA');
    expect(labelTexts).toContain('AUSTRALIA');
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
    expect(markers.length).toBe(6);
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
    expect(srItems.length).toBe(6);
    expect(srItems[0].nativeElement.textContent).toContain('Georgia');

    const srLinks = fixture.debugElement.queryAll(By.css('.sr-only a'));
    expect(srLinks.length).toBe(6);
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

  it('should initialize in WORLD view mode with no country selected and full world viewBox', () => {
    component.viewportWidth.set(1440);
    component.isMobileView.set(false);
    expect(component.viewMode()).toBe('WORLD');
    expect(component.isWorldView()).toBe(true);
    expect(component.isCountryView()).toBe(false);
    expect(component.selectedCountry()).toBeNull();
    expect(component.mapViewBox()).toBe('110 30 840 395');
  });

  it('should transition to COUNTRY view and compute targeted country viewBox when country is clicked', () => {
    component.selectDestination('HU');
    fixture.detectChanges();

    expect(component.viewMode()).toBe('COUNTRY');
    expect(component.isCountryView()).toBe(true);
    expect(component.isWorldView()).toBe(false);
    expect(component.selectedCountry()).toBeTruthy();
    expect(component.selectedCountry()!.countryCode).toBe('HU');
    expect(component.selectedCountry()!.countryName).toBe('Hungary');

    // Target coordinates should be focused on Hungary
    const target = component.targetViewBoxCoords();
    expect(target).toBeTruthy();
    const huMarker = component.activeCountryMarkers().find(m => m.countryCode === 'HU')!;
    const expected = component.getCountryTargetViewBox(huMarker);
    expect(target).toEqual(expected);

    // Zoomed viewBox width should be approximately 4.2x smaller than world width
    expect(target![2]).toBeLessThan(component.worldViewBoxCoords()[2]);

    // Current animated coordinates start and zoom to target
    expect(component.isZooming()).toBe(true);
    expect(component.currentViewBoxCoords()).toBeTruthy();
  });

  it('should smoothly transition from one country to another without resetting to world view', () => {
    // Select Hungary first
    component.selectDestination('HU');
    const huTarget = component.targetViewBoxCoords();
    expect(huTarget).toBeTruthy();

    // Select Kazakhstan next
    component.selectDestination('KZ');
    fixture.detectChanges();

    expect(component.viewMode()).toBe('COUNTRY');
    expect(component.selectedCountry()!.countryCode).toBe('KZ');
    expect(component.selectedCountry()!.countryName).toBe('Kazakhstan');

    const kzTarget = component.targetViewBoxCoords();
    expect(kzTarget).toBeTruthy();
    expect(kzTarget).not.toEqual(huTarget);
    expect(kzTarget).not.toEqual(component.worldViewBoxCoords());
  });

  it('should compute accurate extent and viewBox for Russia without antimeridian wrapping', () => {
    component.viewportWidth.set(1440);
    component.isMobileView.set(false);
    component.selectDestination('RU');
    fixture.detectChanges();

    const target = component.targetViewBoxCoords()!;
    expect(target).toBeTruthy();
    // Russia's width is ~338, with 1.35 padding targetW should be ~456.3
    expect(target[2]).toBeGreaterThan(400);
    expect(target[2]).toBeLessThan(component.worldViewBoxCoords()[2]);

    // The target viewBox must comfortably encompass mainland Russia [544.6, 882.6]
    const leftX = target[0];
    const rightX = target[0] + target[2];
    expect(leftX).toBeLessThanOrEqual(544.6);
    expect(rightX).toBeGreaterThanOrEqual(882.6);
  });

  it('should adapt viewBox aspect ratio for tall countries like Australia so it is not vertically cropped', () => {
    component.viewportWidth.set(1440);
    component.isMobileView.set(false);
    component.selectDestination('AU');
    fixture.detectChanges();

    const target = component.targetViewBoxCoords()!;
    expect(target).toBeTruthy();
    // Australia width is ~66, height is ~57. aspect ~2.126 => fitH_as_W = 57 * 1.35 * 2.126 ~ 163.6
    expect(target[2]).toBeGreaterThan(150);
    expect(target[3]).toBeGreaterThan(70);
  });

  it('should NOT render visible country border/highlight in country view while preserving internal GeoJSON and world view boundaries', () => {
    // Zoom into Georgia
    component.selectDestination('GE');
    fixture.detectChanges();

    // 1. Dedicated highlight must NOT exist
    const highlightPath = fixture.debugElement.query(By.css('.selected-country-highlight'));
    expect(highlightPath).toBeNull();

    // 2. Active country boundary must NOT exist in country view
    const visibleActiveBorders = fixture.debugElement.queryAll(By.css('.country-boundary.is-active'));
    expect(visibleActiveBorders.length).toBe(0);

    // 3. Country GeoJSON remains intact and accessible internally for framing/calculations
    expect(component.activeCountryVector()).toBeTruthy();
    expect(component.activeCountryVector()?.code).toBe('GE');

    // 4. Returning to World View restores interactive country boundaries for navigation
    component.resetToWorldView();
    fixture.detectChanges();
    const worldCountriesLayer = fixture.debugElement.query(By.css('.countries-layer'));
    expect(worldCountriesLayer).toBeTruthy();
  });

  it('should dynamically scale marker ring, point, and font size in country view', () => {
    // In world view
    expect(component.markerScaleFactor()).toBe(1.0);
    expect(component.markerRingRadius()).toBe(4.0);
    expect(component.markerPointRadius()).toBe(2.0);
    expect(component.markerLabelFontSize()).toBe(6.2);

    // Zoom into Hungary (target width 85)
    component.selectDestination('HU');
    // Set currentViewBoxCoords to target to simulate animation completion
    const target = component.targetViewBoxCoords()!;
    component.currentViewBoxCoords.set(target);

    expect(component.markerScaleFactor()).toBeLessThan(0.2);
    expect(component.markerPointRadius()).toBeLessThan(1.0);
    expect(component.markerLabelFontSize()).toBeLessThan(2.0);
  });

  describe('Prompt 2 - High-Resolution Satellite & Boundary Precision', () => {
    it('should accurately invert projection coordinates back to [lon, lat] via unprojectCoordinates', () => {
      // Origin (Greenwich on equator): lon=0, lat=0 -> X=500, Y=265
      const [lon, lat] = unprojectCoordinates(500, 265);
      expect(Math.abs(lon)).toBeLessThan(0.01);
      expect(Math.abs(lat)).toBeLessThan(0.01);

      // Verify mathematical invertibility / roundtrip for Georgia (approx lon 43.5, lat 42.0)
      const [projX, projY] = projectCoordinates(43.5, 42.0);
      const [geoLon, geoLat] = unprojectCoordinates(projX, projY);
      expect(geoLon).toBeCloseTo(43.5, 1);
      expect(geoLat).toBeCloseTo(42.0, 1);
    });

    it('should compute valid geographic bounding boxes for countries with padding', () => {
      const bbox = getCountryGeoBBox('GE');
      expect(bbox).toBeTruthy();
      const [minLon, minLat, maxLon, maxLat] = bbox!;
      expect(minLon).toBeLessThan(maxLon);
      expect(minLat).toBeLessThan(maxLat);
      // Georgia should be within longitudes 35 to 50 and latitudes 38 to 46
      expect(minLon).toBeGreaterThan(35);
      expect(maxLon).toBeLessThan(50);
      expect(minLat).toBeGreaterThan(38);
      expect(maxLat).toBeLessThan(46);
    });

    it('should load dynamic high-resolution satellite imagery URL and set bounds when country is selected', () => {
      component.selectDestination('GE');
      fixture.detectChanges();

      const imgUrl = component.highResImageUrl();
      expect(imgUrl).toBeTruthy();
      expect(imgUrl).toContain('server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export');
      expect(imgUrl).toContain('bbox=');
      expect(imgUrl).toContain('format=jpg');

      const bounds = component.highResImageBounds();
      expect(bounds).toBeTruthy();
      expect(bounds!.width).toBeGreaterThan(0);
      expect(bounds!.height).toBeGreaterThan(0);
    });

    it('should cache satellite image URLs so repeated selections avoid re-requesting', () => {
      component.selectDestination('GE');
      const firstUrl = component.highResImageUrl();
      expect(firstUrl).toBeTruthy();

      // Switch to HU
      component.selectDestination('HU');
      const huUrl = component.highResImageUrl();
      expect(huUrl).not.toEqual(firstUrl);

      // Switch to AU
      component.selectDestination('AU');
      const auUrl = component.highResImageUrl();
      expect(auUrl).toBeTruthy();
      expect(auUrl).not.toEqual(huUrl);
      console.log('AU SATELLITE URL:', auUrl);

      // Switch back to GE
      component.selectDestination('GE');
      const secondUrl = component.highResImageUrl();
      expect(secondUrl).toEqual(firstUrl);
    });

    it('should render floating Back to World button in country view and handle reset', () => {
      // In world view, button should not exist
      let backBtn = fixture.debugElement.query(By.css('.btn-back-to-world'));
      expect(backBtn).toBeNull();

      // Zoom into Georgia
      component.selectDestination('GE');
      fixture.detectChanges();

      backBtn = fixture.debugElement.query(By.css('.btn-back-to-world'));
      expect(backBtn).toBeTruthy();
      expect(backBtn.nativeElement.textContent).toContain('WORLD MAP');

      // Click the Back to World button
      backBtn.nativeElement.click();
      fixture.detectChanges();

      expect(component.isWorldView()).toBe(true);
      expect(component.isCountryView()).toBe(false);
      expect(component.selectedCountry()).toBeNull();
      expect(component.highResImageUrl()).toBeNull();
    });

    it('should reset to world view when ocean base is clicked in country view', () => {
      component.selectDestination('KZ');
      fixture.detectChanges();
      expect(component.isCountryView()).toBe(true);

      const oceanBase = fixture.debugElement.query(By.css('.atlas-ocean-base'));
      expect(oceanBase).toBeTruthy();

      oceanBase.triggerEventHandler('click', null);
      fixture.detectChanges();

      expect(component.isWorldView()).toBe(true);
      expect(component.selectedCountry()).toBeNull();
    });
  });

  describe('Prompt 3: University Locations, Zero Low-Res Flash & Interaction', () => {
    it('should immediately select country and update country name and authoritative university count', () => {
      component.selectDestination('KZ');
      fixture.detectChanges();

      expect(component.selectedCountry()).toBeTruthy();
      expect(component.selectedCountry()?.countryName).toBe('Kazakhstan');
      expect(component.selectedCountry()?.countryCode).toBe('KZ');
      expect(component.viewMode()).toBe('COUNTRY');
      // Total count from backend is preserved (3 universities)
      expect(component.selectedCountry()?.universityCount).toBe(3);
    });

    it('should filter university locations strictly for the selected country and omit unmapped records without coordinates', () => {
      component.selectDestination('KZ');
      fixture.detectChanges();

      const kzUnis = component.activeCountryUniversities();
      // 2 universities have valid cities (Almaty, Astana); the 1 unmapped university without coords is omitted from dots
      expect(kzUnis.length).toBe(2);
      expect(kzUnis.every(u => u.countryCode === 'KZ')).toBe(true);
      expect(kzUnis.some(u => u.name.includes('Almaty') || u.city === 'Almaty')).toBe(true);
      expect(kzUnis.some(u => u.name.includes('Astana') || u.city === 'Astana')).toBe(true);
      // Unmapped record is not rendered
      expect(kzUnis.some(u => u.id === 'u_kz_unmapped')).toBe(false);

      // Total count displayed still comes from authoritative backend
      expect(component.selectedCountry()?.universityCount).toBe(3);
    });

    it('should project authentic coordinates to SVG canvas coordinates for universities', () => {
      component.selectDestination('HU');
      fixture.detectChanges();

      const huUnis = component.activeCountryUniversities();
      expect(huUnis.length).toBe(1);
      const semmelweis = huUnis[0];
      expect(semmelweis.name).toBe('Semmelweis University');
      expect(semmelweis.city).toBe('Budapest');
      expect(semmelweis.x).toBeGreaterThan(450);
      expect(semmelweis.x).toBeLessThan(650);
      expect(semmelweis.y).toBeGreaterThan(100);
      expect(semmelweis.y).toBeLessThan(250);
    });

    it('should handle hover on university marker and update hoveredUniversity and activeUniversityPopup', () => {
      component.selectDestination('GE');
      fixture.detectChanges();

      const unis = component.activeCountryUniversities();
      expect(unis.length).toBe(2);

      component.onUniversityHover(unis[0]);
      expect(component.hoveredUniversity()).toBe(unis[0]);
      expect(component.activeUniversityPopup()).toBe(unis[0]);

      component.onUniversityHover(null);
      expect(component.hoveredUniversity()).toBeNull();
      expect(component.activeUniversityPopup()).toBeNull();
    });

    it('should handle click on university marker, render details card, and support closing it', () => {
      component.selectDestination('GE');
      fixture.detectChanges();

      const unis = component.activeCountryUniversities();
      const tsmu = unis[0];

      // Click university
      component.onUniversityClick(tsmu);
      fixture.detectChanges();

      expect(component.selectedUniversity()).toBe(tsmu);
      expect(component.activeUniversityPopup()).toBe(tsmu);

      const card = fixture.debugElement.query(By.css('.university-detail-card'));
      expect(card).toBeTruthy();
      expect(card.nativeElement.textContent).toContain('Tbilisi State Medical University');
      expect(card.nativeElement.textContent).toContain('Georgia');

      // Close card
      component.clearUniversitySelection();
      fixture.detectChanges();

      expect(component.selectedUniversity()).toBeNull();
      const closedCard = fixture.debugElement.query(By.css('.university-detail-card'));
      expect(closedCard).toBeNull();
    });

    it('should reset university dots and selections when returning to world view', () => {
      component.selectDestination('GE');
      fixture.detectChanges();

      const unis = component.activeCountryUniversities();
      component.onUniversityClick(unis[0]);
      fixture.detectChanges();
      expect(component.selectedUniversity()).toBeTruthy();

      component.resetToWorldView();
      fixture.detectChanges();

      expect(component.isWorldView()).toBe(true);
      expect(component.activeCountryUniversities()).toEqual([]);
      expect(component.selectedUniversity()).toBeNull();
      expect(component.hoveredUniversity()).toBeNull();
    });

    it('should immediately use cached satellite imagery without network delay', () => {
      // Preload image into cache
      const code = 'KZ';
      const target = component.getCountryTargetViewBox(component.activeCountryMarkers().find(m => m.countryCode === code)!);
      const url = component.getSatelliteUrlForCountry(component.activeCountryMarkers().find(m => m.countryCode === code)!, target)!;
      (component as any).satelliteImageCache.set(code, url);

      component.selectDestination(code);
      fixture.detectChanges();

      // Because it was cached, highResImageLoaded should be true immediately
      expect(component.highResImageLoaded()).toBe(true);
      expect(component.highResImageUrl()).toBe(url);
    });
  });
});


