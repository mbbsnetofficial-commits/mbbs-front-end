import type {
  AdminCountry,
  AdminUniversity,
} from '../../../../../shared/models/admin-university.model';
import { NATURAL_EARTH_COUNTRIES, projectCoordinates } from './destinations-geo.data';
import { exactCoordinates, type GeoPoint } from './globe-geography';
import { verifiedUniversityLocation } from './verified-university-locations.data';

export type GeographicStatus =
  | 'VALID'
  | 'INVALID'
  | 'MISSING_COORDINATES'
  | 'INVALID_COORDINATES'
  | 'COUNTRY_DATA_MISMATCH'
  | 'BOUNDARY_REQUIRES_VERIFICATION';
export interface UniversityGeographicAudit {
  university: AdminUniversity;
  country: AdminCountry | null;
  status: GeographicStatus;
  verification: 'VALID' | 'DATA_REQUIRES_VERIFICATION';
  reason: string;
  coordinates: GeoPoint | null;
  coordinateSource: 'api' | 'verified' | null;
  detectedCountryCodes: string[];
  directoryEligible: boolean;
  markerEligible: boolean;
}

/** IDs, including populated references, are authoritative; names never assign a country. */
export function countryId(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object' && '_id' in value) return countryId(value._id);
  return '';
}
const code = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toUpperCase() : '';
type Point = [number, number];
interface Polygon {
  code: string;
  rings: Point[][];
  bounds: number[];
}
let polygons: Polygon[] | undefined;

function boundaryPolygons(): Polygon[] {
  // Preserve every ring (islands and holes). Do not use mainland camera bounds for membership.
  return (polygons ??= NATURAL_EARTH_COUNTRIES.map((country) => {
    const rings = country.d
      .split(/(?=M)/)
      .map((path) => {
        const numbers = path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
        const points: Point[] = [];
        for (let i = 0; i + 1 < numbers.length; i += 2) points.push([numbers[i], numbers[i + 1]]);
        return points;
      })
      .filter((ring) => ring.length >= 3);
    const points = rings.flat();
    return {
      code: country.code,
      rings,
      bounds: [
        Math.min(...points.map((p) => p[0])),
        Math.min(...points.map((p) => p[1])),
        Math.max(...points.map((p) => p[0])),
        Math.max(...points.map((p) => p[1])),
      ],
    };
  }));
}

/** Boundary paths are rounded to 0.1 projected units. Near-edge results are not proof. */
export function geographicCountries(point: GeoPoint): { inside: string[]; near: string[] } {
  const [x, y] = projectCoordinates(point.lng, point.lat);
  const tolerance = 0.15;
  const inside: string[] = [],
    near: string[] = [];
  for (const polygon of boundaryPolygons()) {
    const [w, s, e, n] = polygon.bounds;
    if (x < w - tolerance || x > e + tolerance || y < s - tolerance || y > n + tolerance) continue;
    let contained = false,
      edge = false;
    for (const ring of polygon.rings) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [ax, ay] = ring[j],
          [bx, by] = ring[i];
        if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax)
          contained = !contained;
        const dx = bx - ax,
          dy = by - ay,
          length = dx * dx + dy * dy;
        const t = length ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length)) : 0;
        if (Math.hypot(x - ax - t * dx, y - ay - t * dy) <= tolerance) edge = true;
      }
    }
    if (contained) inside.push(polygon.code);
    if (edge) near.push(polygon.code);
  }
  return { inside, near };
}

const provided = (value: unknown): boolean => value !== undefined && value !== null && value !== '';

export function auditUniversity(
  university: AdminUniversity,
  countries: AdminCountry[],
): UniversityGeographicAudit {
  const raw = university as AdminUniversity & { country_code?: string; countryId?: string };
  const id = countryId(university.country_id);
  const matching = countries.filter((c) => countryId(c._id) === id && !!id);
  const country = matching.length === 1 ? matching[0] : null;
  const result: UniversityGeographicAudit = {
    university,
    country,
    status: 'INVALID',
    verification: 'DATA_REQUIRES_VERIFICATION',
    reason: '',
    coordinates: null,
    coordinateSource: null,
    detectedCountryCodes: [],
    directoryEligible: false,
    markerEligible: false,
  };
  const finish = (status: GeographicStatus, reason: string) => ({ ...result, status, reason });
  if (!countryId(university._id) || !university.name?.trim())
    return finish('INVALID', 'Missing university identity.');
  if (!country || !code(country.country_code))
    return finish('INVALID', 'Missing, unknown or ambiguous country ID/code.');
  if (
    (raw.country_code && code(raw.country_code) !== code(country.country_code)) ||
    (raw.countryId && countryId(raw.countryId) !== id)
  ) {
    return finish('COUNTRY_DATA_MISMATCH', 'Conflicting country identifiers in university record.');
  }
  result.directoryEligible = university.status !== 'INACTIVE' && country.status === 'ACTIVE';
  const primary = exactCoordinates(university.latitude, university.longitude);
  const alias = exactCoordinates(university.lat, university.lng);
  if (primary && alias && (primary.lat !== alias.lat || primary.lng !== alias.lng)) {
    return finish(
      'INVALID_COORDINATES',
      'Conflicting complete latitude/longitude and lat/lng pairs.',
    );
  }
  const hasCoordinates = [
    university.latitude,
    university.longitude,
    university.lat,
    university.lng,
  ].some(provided);
  const fallback = !hasCoordinates
    ? verifiedUniversityLocation(country.country_code, university.name)
    : null;
  const coordinates = primary ?? alias ?? fallback;
  if (!coordinates)
    return finish(
      hasCoordinates ? 'INVALID_COORDINATES' : 'MISSING_COORDINATES',
      hasCoordinates
        ? 'Supplied coordinates are incomplete, nonnumeric or out of range.'
        : 'No exact campus coordinates available; backend association is geographically unverified.',
    );
  result.coordinates = { lat: coordinates.lat, lng: coordinates.lng };
  result.coordinateSource = primary || alias ? 'api' : 'verified';
  const detected = geographicCountries(coordinates);
  result.detectedCountryCodes = detected.inside;
  const assigned = code(country.country_code);
  if (
    !boundaryPolygons().some((p) => p.code === assigned) ||
    detected.near.length ||
    detected.inside.length !== 1
  ) {
    return finish(
      'BOUNDARY_REQUIRES_VERIFICATION',
      'Missing, rounded, coastal, border or overlapping boundary geometry cannot establish membership confidently.',
    );
  }
  if (detected.inside[0] !== assigned) {
    result.directoryEligible = false;
    const swapped = exactCoordinates(coordinates.lng, coordinates.lat);
    const suspectedSwap = swapped && geographicCountries(swapped).inside.includes(assigned);
    return finish(
      'COUNTRY_DATA_MISMATCH',
      `Coordinates fall inside ${detected.inside[0]}, not ${assigned}.${suspectedSwap ? ' Possible swapped latitude/longitude; no automatic correction applied.' : ''}`,
    );
  }
  result.verification = 'VALID';
  result.markerEligible = result.directoryEligible;
  return finish(
    'VALID',
    'Country ID and coordinate membership agree with the existing boundary dataset; this does not independently certify campus identity.',
  );
}

/** Audit all records, including inactive/orphan/duplicate entries, without rewriting backend data. */
export function auditUniversities(
  universities: AdminUniversity[],
  countries: AdminCountry[],
): UniversityGeographicAudit[] {
  const counts = new Map<string, number>();
  for (const u of universities)
    counts.set(countryId(u._id), (counts.get(countryId(u._id)) ?? 0) + 1);
  return universities.map((u) => {
    const row = auditUniversity(u, countries);
    if ((counts.get(countryId(u._id)) ?? 0) > 1)
      return {
        ...row,
        status: 'INVALID' as const,
        verification: 'DATA_REQUIRES_VERIFICATION' as const,
        reason: 'Duplicate university ID; ambiguous records require source correction.',
        directoryEligible: false,
        markerEligible: false,
      };
    return row;
  });
}
