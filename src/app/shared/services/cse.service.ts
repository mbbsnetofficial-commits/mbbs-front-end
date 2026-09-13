import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminCountry,
  AdminUniversity,
  GroupedCountryUniversities,
} from '../models/admin-university.model';

@Injectable({
  providedIn: 'root',
})
export class CseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = (environment as any).cseApiBaseUrl || 'https://api2.mbbs.net/api/v1';

  private adminCountriesResponseCache$: Observable<{
    status: string;
    count: number;
    data: AdminCountry[];
  }> | null = null;
  private groupedUniversitiesCache$: Observable<GroupedCountryUniversities[]> | null = null;
  private adminUniversitiesCache$: Observable<AdminUniversity[]> | null = null;

  getAdminCountriesResponse(): Observable<{ status: string; count: number; data: AdminCountry[] }> {
    if (this.adminCountriesResponseCache$) {
      return this.adminCountriesResponseCache$;
    }

    const url = `${this.baseUrl}/cse/admin/countries`;
    this.adminCountriesResponseCache$ = this.http.get<any>(url).pipe(
      map((res) => {
        if (res && Array.isArray(res.data)) {
          return {
            status: res.status || 'success',
            count: typeof res.count === 'number' ? res.count : res.data.length,
            data: res.data,
          };
        } else if (Array.isArray(res)) {
          return {
            status: 'success',
            count: res.length,
            data: res,
          };
        }
        return { status: 'empty', count: 0, data: [] };
      }),
      catchError((err) => {
        console.warn('API /cse/admin/countries error, falling back:', err);
        return of({ status: 'error', count: 0, data: [] });
      }),
      shareReplay(1),
    );

    return this.adminCountriesResponseCache$;
  }

  getAdminCountries(): Observable<AdminCountry[]> {
    return this.getAdminCountriesResponse().pipe(map((res) => res.data));
  }

  getAdminUniversities(): Observable<AdminUniversity[]> {
    if (this.adminUniversitiesCache$) return this.adminUniversitiesCache$;
    const url = `${this.baseUrl}/cse/admin/universities`;
    this.adminUniversitiesCache$ = this.http.get<any>(url).pipe(
      map((res) => {
        if (res && Array.isArray(res.data)) {
          return res.data;
        } else if (Array.isArray(res)) {
          return res;
        }
        return [];
      }),
      catchError((err) => {
        console.warn('API /cse/admin/universities error, falling back:', err);
        return of([]);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.adminUniversitiesCache$;
  }

  getGroupedUniversities(): Observable<GroupedCountryUniversities[]> {
    if (this.groupedUniversitiesCache$) {
      return this.groupedUniversitiesCache$;
    }

    this.groupedUniversitiesCache$ = forkJoin({
      countries: this.getAdminCountries(),
      universities: this.getAdminUniversities(),
    }).pipe(
      map(({ countries, universities }) => {
        const activeCountries = (countries || [])
          .filter((c) => c && c.status !== 'INACTIVE')
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

        const activeUniversities = (universities || []).filter((u) => u && u.status !== 'INACTIVE');

        const grouped: GroupedCountryUniversities[] = [];

        for (const c of activeCountries) {
          const matchingUnis = activeUniversities.filter(
            (u) => String(u.country_id) === String(c._id),
          );
          if (matchingUnis.length > 0) {
            grouped.push({
              countryId: c._id,
              countryName: c.name,
              countryCode: c.country_code || '',
              displayOrder: c.display_order ?? 0,
              universities: matchingUnis,
            });
          }
        }

        return grouped;
      }),
      catchError(() => of([])),
      shareReplay(1),
    );

    return this.groupedUniversitiesCache$;
  }
}
