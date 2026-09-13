import { describe, expect, it } from 'vitest';
import type {
  AdminCountry,
  AdminUniversity,
} from '../../../../../shared/models/admin-university.model';
import {
  auditUniversities,
  auditUniversity,
  geographicCountries,
} from './university-geographic-audit';

const countries: AdminCountry[] = [
  {
    _id: 'turkey-id',
    name: 'Türkiye',
    slug: 'turkiye',
    country_code: 'TR',
    status: 'ACTIVE',
    display_order: 0,
  },
  {
    _id: 'georgia-id',
    name: 'Georgia',
    slug: 'georgia',
    country_code: 'GE',
    status: 'ACTIVE',
    display_order: 1,
  },
];
const university: AdminUniversity = {
  _id: 'campus-id',
  name: 'Geographic test fixture',
  country_id: 'turkey-id',
  status: 'ACTIVE',
  latitude: 39.93,
  longitude: 32.86,
};

describe('University country integrity', () => {
  it('uses stable IDs regardless of Turkey/Türkiye naming', () => {
    expect(auditUniversity(university, countries)).toMatchObject({
      status: 'VALID',
      markerEligible: true,
      detectedCountryCodes: ['TR'],
    });
  });
  it('quarantines a Georgian coordinate assigned to Turkey from both consumers', () => {
    const row = auditUniversity({ ...university, latitude: 41.745, longitude: 44.775 }, countries);
    expect(row).toMatchObject({
      status: 'COUNTRY_DATA_MISMATCH',
      directoryEligible: false,
      markerEligible: false,
      detectedCountryCodes: ['GE'],
    });
    expect(row.coordinates).toEqual({ lat: 41.745, lng: 44.775 });
  });
  it('rejects contradictory country codes even if the ID matches', () => {
    expect(
      auditUniversity({ ...university, country_code: 'GE' } as AdminUniversity, countries).status,
    ).toBe('COUNTRY_DATA_MISMATCH');
  });
  it.each(['', 'unknown'])('does not infer a country from the name when ID is %s', (country_id) => {
    expect(
      auditUniversity({ ...university, country_id, name: 'Ankara University' }, countries),
    ).toMatchObject({ status: 'INVALID', directoryEligible: false, markerEligible: false });
  });
  it('quarantines duplicate university IDs', () => {
    expect(
      auditUniversities([university, { ...university, country_id: 'georgia-id' }], countries).every(
        (r) => r.status === 'INVALID' && !r.directoryEligible,
      ),
    ).toBe(true);
  });
  it('does not replace invalid backend coordinates with an existing verified fallback', () => {
    expect(
      auditUniversity({ ...university, name: 'Ankara University', latitude: 999 }, countries),
    ).toMatchObject({ status: 'INVALID_COORDINATES', coordinates: null, markerEligible: false });
  });
  it('keeps missing coordinates unverified in the assigned directory without a marker', () => {
    expect(
      auditUniversity({ ...university, latitude: undefined, longitude: undefined }, countries),
    ).toMatchObject({
      status: 'MISSING_COORDINATES',
      verification: 'DATA_REQUIRES_VERIFICATION',
      directoryEligible: true,
      markerEligible: false,
    });
  });
  it('rejects conflicting coordinate pairs without silently picking one', () => {
    expect(auditUniversity({ ...university, lat: 41.745, lng: 44.775 }, countries).status).toBe(
      'INVALID_COORDINATES',
    );
  });
  it('flags a possible swap but never changes supplied coordinates', () => {
    const row = auditUniversity({ ...university, latitude: 32.86, longitude: 39.93 }, countries);
    expect(row.markerEligible).toBe(false);
    expect(row.coordinates).toEqual({ lat: 32.86, lng: 39.93 });
  });
  it('does not mistake ocean or rounded coast geometry for a confident country match', () => {
    expect(auditUniversity({ ...university, latitude: 0, longitude: 0 }, countries).status).toBe(
      'BOUNDARY_REQUIRES_VERIFICATION',
    );
  });
  it.each([
    ['GE', 41.745, 44.775],
    ['TR', 39.93, 32.86],
    ['HU', 47.49, 19.05],
    ['AU', -25, 134],
    ['KZ', 48, 68],
    ['RU', 55.75, 37.62],
    ['US', 64, -150],
    ['NZ', -44, 170],
    ['LS', -29.5, 28.5],
  ] as const)('reuses all polygon rings to locate %s', (country, lat, lng) => {
    expect(geographicCountries({ lat, lng }).inside).toEqual([country]);
  });
});
