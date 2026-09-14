import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, shareReplay, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminCountry, AdminUniversity, GroupedCountryUniversities } from '../models/admin-university.model';
import { INDIA_FALLBACK_COUNTRY, INDIA_FALLBACK_UNIVERSITIES } from '../../students/static/dashboard/components/destinations-map/india-destination.data';

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
      timeout(4000),
      map(res => {
        let list: AdminCountry[] = [];
        if (res && Array.isArray(res.data)) {
          list = res.data;
        } else if (Array.isArray(res)) {
          list = res;
        }
        if (list.length > 0) {
          const hasIndia = list.some(c => c && (c.country_code?.toUpperCase() === 'IN' || c._id === 'c_in'));
          const data = hasIndia ? list : [...list, INDIA_FALLBACK_COUNTRY];
          return {
            status: res.status || 'success',
            count: data.length,
            data
          };
        }
        const fallback = this.getFallbackAdminCountries();
        return { status: 'fallback', count: fallback.length, data: fallback };
      }),
      catchError(err => {
        console.warn('API /cse/admin/countries error, falling back:', err);
        const fallback = this.getFallbackAdminCountries();
        return of({ status: 'fallback', count: fallback.length, data: fallback });
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
      timeout(4000),
      map(res => {
        let list: AdminUniversity[] = [];
        if (res && Array.isArray(res.data)) {
          list = res.data;
        } else if (Array.isArray(res)) {
          list = res;
        }
        if (list.length > 0) {
          const hasIndia = list.some(u => u && (String(u.country_id) === 'c_in' || u._id?.startsWith('u_in')));
          return hasIndia ? list : [...list, ...INDIA_FALLBACK_UNIVERSITIES];
        }
        return this.getFallbackAdminUniversities();
      }),
      catchError(err => {
        console.warn('API /cse/admin/universities error, falling back:', err);
        return of(this.getFallbackAdminUniversities());
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

        const hasIndiaGroup = grouped.some(g => g.countryCode?.toUpperCase() === 'IN' || g.countryId === 'c_in');
        if (!hasIndiaGroup) {
          grouped.push({
            countryId: INDIA_FALLBACK_COUNTRY._id,
            countryName: INDIA_FALLBACK_COUNTRY.name,
            countryCode: INDIA_FALLBACK_COUNTRY.country_code,
            displayOrder: INDIA_FALLBACK_COUNTRY.display_order,
            universities: INDIA_FALLBACK_UNIVERSITIES,
          });
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

  getFallbackAdminCountries(): AdminCountry[] {
    return this.getMockGroupedUniversities().map(g => ({
      _id: g.countryId,
      name: g.countryName,
      slug: g.countryName.toLowerCase().replace(/\s+/g, '-'),
      country_code: g.countryCode,
      status: 'ACTIVE',
      display_order: g.displayOrder,
    }));
  }

  getFallbackAdminUniversities(): AdminUniversity[] {
    return this.getMockGroupedUniversities().flatMap(g => g.universities);
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
      },
      {
        countryId: INDIA_FALLBACK_COUNTRY._id,
        countryName: INDIA_FALLBACK_COUNTRY.name,
        countryCode: INDIA_FALLBACK_COUNTRY.country_code,
        displayOrder: INDIA_FALLBACK_COUNTRY.display_order,
        universities: INDIA_FALLBACK_UNIVERSITIES,
      },
    ];
  }
}
