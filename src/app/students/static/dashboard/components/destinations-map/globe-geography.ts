import {
  findCountryVector,
  lookupCountryCoordinate,
  unprojectCoordinates,
} from './destinations-geo.data';

export interface GeoPoint {
  lat: number;
  lng: number;
}
export interface CountryFrame extends GeoPoint {
  radius: number;
  bounds: [number, number, number, number];
}
const radians = Math.PI / 180;

/** Matches Three SphereGeometry's equirectangular UVs: Greenwich is +X, east is -Z. */
export function earthPosition(lat: number, lng: number, radius = 1): [number, number, number] {
  const phi = lat * radians,
    lambda = lng * radians;
  return [
    radius * Math.cos(phi) * Math.cos(lambda),
    radius * Math.sin(phi),
    -radius * Math.cos(phi) * Math.sin(lambda),
  ];
}

export function exactCoordinates(lat: unknown, lng: unknown): GeoPoint | null {
  // Accept decimal API strings; never coerce blanks, booleans or null to zero.
  const decimal = (value: unknown): number => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string' || !/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(value.trim())) return NaN;
    return Number(value.trim());
  };
  const latitude = decimal(lat),
    longitude = decimal(lng);
  return Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
    ? { lat: latitude, lng: longitude }
    : null;
}

export function angularDistance(a: GeoPoint, b: GeoPoint): number {
  const p = earthPosition(a.lat, a.lng),
    q = earthPosition(b.lat, b.lng);
  return Math.acos(
    Math.max(
      -1,
      Math.min(
        1,
        p.reduce((s, n, i) => s + n * q[i], 0),
      ),
    ),
  );
}

const frames = new Map<string, CountryFrame>();
/** Reuse the actual mainland polygon, not corners of its distorted projected bounding box. */
export function countryFrame(code: string): CountryFrame {
  const cached = frames.get(code);
  if (cached) return cached;
  const coord = lookupCountryCoordinate(code) ?? { lat: 20, lng: 30 };
  const rings = (findCountryVector(code)?.d ?? '')
    .split(/(?=M)/)
    .map((r) => r.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? []);
  const main = rings.reduce((a, b) => (a.length > b.length ? a : b), [] as number[]);
  const points: GeoPoint[] = [];
  for (let i = 0; i < main.length; i += 2) {
    const [lng, lat] = unprojectCoordinates(main[i], main[i + 1]);
    points.push({ lat, lng });
  }
  if (!points.length) points.push(coord);
  const west = Math.min(...points.map((p) => p.lng)),
    east = Math.max(...points.map((p) => p.lng));
  const south = Math.min(...points.map((p) => p.lat)),
    north = Math.max(...points.map((p) => p.lat));
  const center = { lat: (south + north) / 2, lng: (west + east) / 2 };
  const radius = Math.max(3 * radians, ...points.map((p) => angularDistance(center, p)));
  // A generous terrain apron keeps the imagery edge outside the focused camera view.
  const pad = Math.max(12, (north - south) * 0.7, (east - west) * 0.4);
  const frame: CountryFrame = {
    ...center,
    radius,
    bounds: [
      Math.max(-180, west - pad),
      Math.max(-85, south - pad),
      Math.min(180, east + pad),
      Math.min(85, north + pad),
    ],
  };
  frames.set(code, frame);
  return frame;
}

export function focusDistance(radius: number, fov: number, aspect: number): number {
  const halfFov = Math.atan(Math.tan((fov * radians) / 2) * Math.min(1, aspect * 0.66));
  return Math.max(1.24, Math.cos(radius) + Math.sin(radius) / Math.tan(halfFov * 0.82));
}

export function satelliteUrl(bounds: CountryFrame['bounds'], width = 1536): string {
  const [w, s, e, n] = bounds;
  const height = Math.max(256, Math.min(width, Math.round((width * (n - s)) / (e - w))));
  return (
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export' +
    `?bbox=${bounds.join(',')}&bboxSR=4326&imageSR=4326&size=${width},${height}&adjustAspectRatio=false&format=jpg&f=image`
  );
}
