import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CseService } from './cse.service';

describe('Destination API snapshot consistency', () => {
  let service: CseService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CseService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('shares one university request between parent grouping and the globe', () => {
    let grouped: any, direct: any;
    service.getGroupedUniversities().subscribe((value) => (grouped = value));
    service.getAdminUniversities().subscribe((value) => (direct = value));
    http
      .expectOne((request) => request.url.endsWith('/countries'))
      .flush({
        data: [
          { _id: 'TR', country_code: 'TR', name: 'Turkey', status: 'ACTIVE', display_order: 0 },
        ],
      });
    http
      .expectOne((request) => request.url.endsWith('/universities'))
      .flush({ data: [{ _id: 'u1', country_id: 'TR', name: 'API University', status: 'ACTIVE' }] });
    expect(grouped[0].universities[0]).toBe(direct[0]);
    service.getAdminUniversities().subscribe();
    http.expectNone((request) => request.url.endsWith('/universities'));
  });
  it('never replaces an empty API dataset with mock universities', () => {
    let grouped: unknown;
    service.getGroupedUniversities().subscribe((value) => (grouped = value));
    http.expectOne((request) => request.url.endsWith('/countries')).flush({ data: [] });
    http.expectOne((request) => request.url.endsWith('/universities')).flush({ data: [] });
    expect(grouped).toEqual([]);
  });
});
