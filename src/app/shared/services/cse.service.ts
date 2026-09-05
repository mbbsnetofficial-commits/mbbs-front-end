import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminCountry, AdminUniversity, GroupedCountryUniversities } from '../models/admin-university.model';

@Injectable({
  providedIn: 'root'
})
export class CseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = (environment as any).cseApiBaseUrl || 'https://api2.mbbs.net/api/v1';

  private adminCountriesResponseCache$: Observable<{ status: string; count: number; data: AdminCountry[] }> | null = null;
  private groupedUniversitiesCache$: Observable<GroupedCountryUniversities[]> | null = null;

  getAdminCountriesResponse(): Observable<{ status: string; count: number; data: AdminCountry[] }> {
    if (this.adminCountriesResponseCache$) {
      return this.adminCountriesResponseCache$;
    }

    const url = `${this.baseUrl}/cse/admin/countries`;
    this.adminCountriesResponseCache$ = this.http.get<any>(url).pipe(
      map(res => {
        if (res && Array.isArray(res.data)) {
          return {
            status: res.status || 'success',
            count: typeof res.count === 'number' ? res.count : res.data.length,
            data: res.data
          };
        } else if (Array.isArray(res)) {
          return {
            status: 'success',
            count: res.length,
            data: res
          };
        }
        return { status: 'empty', count: 0, data: [] };
      }),
      catchError(err => {
        console.warn('API /cse/admin/countries error, falling back:', err);
        return of({ status: 'error', count: 0, data: [] });
      }),
      shareReplay(1)
    );

    return this.adminCountriesResponseCache$;
  }

  getAdminCountries(): Observable<AdminCountry[]> {
    return this.getAdminCountriesResponse().pipe(map(res => res.data));
  }

  getAdminUniversities(): Observable<AdminUniversity[]> {
    const url = `${this.baseUrl}/cse/admin/universities`;
    return this.http.get<any>(url).pipe(
      map(res => {
        if (res && Array.isArray(res.data)) {
          return res.data;
        } else if (Array.isArray(res)) {
          return res;
        }
        return [];
      }),
      catchError(err => {
        console.warn('API /cse/admin/universities error, falling back:', err);
        return of([]);
      })
    );
  }

  getGroupedUniversities(): Observable<GroupedCountryUniversities[]> {
    if (this.groupedUniversitiesCache$) {
      return this.groupedUniversitiesCache$;
    }

    this.groupedUniversitiesCache$ = forkJoin({
      countries: this.getAdminCountries(),
      universities: this.getAdminUniversities()
    }).pipe(
      map(({ countries, universities }) => {
        const activeCountries = (countries || [])
          .filter(c => c && c.status !== 'INACTIVE')
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

        const activeUniversities = (universities || []).filter(u => u && u.status !== 'INACTIVE');

        const grouped: GroupedCountryUniversities[] = [];

        for (const c of activeCountries) {
          const matchingUnis = activeUniversities.filter(u => String(u.country_id) === String(c._id));
          if (matchingUnis.length > 0) {
            grouped.push({
              countryId: c._id,
              countryName: c.name,
              countryCode: c.country_code || '',
              displayOrder: c.display_order ?? 0,
              universities: matchingUnis
            });
          }
        }

        if (grouped.length === 0) {
          return this.getMockGroupedUniversities();
        }

        return grouped;
      }),
      catchError(() => of(this.getMockGroupedUniversities())),
      shareReplay(1)
    );

    return this.groupedUniversitiesCache$;
  }

  getMockGroupedUniversities(): GroupedCountryUniversities[] {
    return [
      {
        countryId: 'c_au',
        countryName: 'Australia',
        countryCode: 'AU',
        displayOrder: 1,
        universities: [
          { _id: 'u_au1', country_id: 'c_au', name: 'Adelaide University', status: 'ACTIVE' },
          { _id: 'u_au2', country_id: 'c_au', name: 'James Cook University', status: 'ACTIVE' },
          { _id: 'u_au3', country_id: 'c_au', name: 'University of Sydney', status: 'ACTIVE' },
          { _id: 'u_au4', country_id: 'c_au', name: 'Monash University', status: 'ACTIVE' },
          { _id: 'u_au5', country_id: 'c_au', name: 'University of Queensland', status: 'ACTIVE' },
        ]
      },
      {
        countryId: 'c_ru',
        countryName: 'Russia',
        countryCode: 'RU',
        displayOrder: 2,
        universities: [
          { _id: 'u_ru1', country_id: 'c_ru', name: 'First Moscow State Medical University', status: 'ACTIVE' },
          { _id: 'u_ru2', country_id: 'c_ru', name: 'Pirogov Russian National Research Medical University', status: 'ACTIVE' },
          { _id: 'u_ru3', country_id: 'c_ru', name: 'Kazan State Medical University', status: 'ACTIVE' },
          { _id: 'u_ru4', country_id: 'c_ru', name: 'Crimea Federal University', status: 'ACTIVE' },
        ]
      },
      {
        countryId: 'c_ge',
        countryName: 'Georgia',
        countryCode: 'GE',
        displayOrder: 3,
        universities: [
          { _id: 'u_ge1', country_id: 'c_ge', name: 'Tbilisi State Medical University', status: 'ACTIVE' },
          { _id: 'u_ge2', country_id: 'c_ge', name: 'Batum Shota Rustaveli State University', status: 'ACTIVE' },
          { _id: 'u_ge3', country_id: 'c_ge', name: 'Akaki Tsereteli State University', status: 'ACTIVE' },
        ]
      },
      {
        countryId: 'c_kz',
        countryName: 'Kazakhstan',
        countryCode: 'KZ',
        displayOrder: 4,
        universities: [
          { _id: 'u_kza1', country_id: 'c_kz', name: 'Kazakh National Medical University', status: 'ACTIVE' },
          { _id: 'u_kza2', country_id: 'c_kz', name: 'Astana Medical University', status: 'ACTIVE' },
          { _id: 'u_kza3', country_id: 'c_kz', name: 'Semey State Medical University', status: 'ACTIVE' },
        ]
      },
      {
        countryId: 'c_kg',
        countryName: 'Kyrgyzstan',
        countryCode: 'KG',
        displayOrder: 5,
        universities: [
          { _id: 'u_kg1', country_id: 'c_kg', name: 'Kyrgyz State Medical Academy', status: 'ACTIVE' },
          { _id: 'u_kg2', country_id: 'c_kg', name: 'Osh State University Medical Faculty', status: 'ACTIVE' },
          { _id: 'u_kg3', country_id: 'c_kg', name: 'Asian Medical Institute', status: 'ACTIVE' },
        ]
      },
      {
        countryId: 'c_uz',
        countryName: 'Uzbekistan',
        countryCode: 'UZ',
        displayOrder: 6,
        universities: [
          { _id: 'u_uz1', country_id: 'c_uz', name: 'Tashkent Medical Academy', status: 'ACTIVE' },
          { _id: 'u_uz2', country_id: 'c_uz', name: 'Samarkand State Medical University', status: 'ACTIVE' },
          { _id: 'u_uz3', country_id: 'c_uz', name: 'Bukhara State Medical Institute', status: 'ACTIVE' },
        ]
      }
    ];
  }
}
