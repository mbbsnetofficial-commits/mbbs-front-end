import type { GeoPoint } from './globe-geography';

export interface VerifiedUniversityLocation extends GeoPoint {
  city: string;
  countryCode: string;
  locationLabel: string;
  sourceLabel: string;
  sourceUrl: string;
  imageUrl?: string;
  logoUrl?: string;
}

const entries: Array<[string, VerifiedUniversityLocation]> = [
  [
    'TR:ACIBADEM MEHMET ALI AYDINLAR UNIVERSITY',
    {
      countryCode: 'TR',
      city: 'Istanbul',
      lat: 40.97836,
      lng: 29.11033,
      locationLabel: 'Kerem Aydinlar Campus, Atasehir, Istanbul',
      sourceLabel:
        'Kerem Aydinlar campus address checked against official page; OpenStreetMap campus location',
      sourceUrl: 'https://mapcarta.com/W254031521',
      logoUrl: 'https://www.acibadem.edu.tr/sites/default/files/2025-04/acu_logo.svg',
    },
  ],
  [
    'TR:ANKARA UNIVERSITY',
    {
      countryCode: 'TR',
      city: 'Ankara',
      lat: 39.93000831907095,
      lng: 32.85866413122493,
      locationLabel: 'Faculty of Medicine Morphology Campus, Altindag, Ankara',
      sourceLabel: 'Official Faculty of Medicine campus map',
      sourceUrl: 'https://www.medicine.ankara.edu.tr/en/campuses/',
      logoUrl:
        'https://www.medicine.ankara.edu.tr/wp-content/uploads/sites/121/2018/06/medicinelogo.png',
    },
  ],
  [
    'TR:KOC UNIVERSITY',
    {
      countryCode: 'TR',
      city: 'Istanbul',
      lat: 41.20586,
      lng: 29.0752,
      locationLabel: 'Rumelifeneri Campus, Sariyer, Istanbul',
      sourceLabel: 'Official campus address; coordinates verified from map listing',
      sourceUrl: 'https://www.ku.edu.tr/iletisim/kampuslerimiz/rumelifeneri-kampusu/',
      logoUrl: 'https://www.ku.edu.tr/wp-content/uploads/2023/09/logo-renkli.png',
    },
  ],
  [
    'TR:HACETTEPE UNIVERSITY',
    {
      countryCode: 'TR',
      city: 'Ankara',
      lat: 39.93179163888889,
      lng: 32.8626833,
      locationLabel: 'Faculty of Medicine, Sihhiye Campus, Ankara',
      sourceLabel: 'Official campus contact; coordinates verified from Wikidata',
      sourceUrl: 'https://hacettepe.edu.tr/about/contact',
    },
  ],
  [
    'TR:ISTANBUL UNIVERSITY-CERRAHPASA',
    {
      countryCode: 'TR',
      city: 'Istanbul',
      lat: 41.005672,
      lng: 28.940349,
      locationLabel: 'Cerrahpasa Faculty of Medicine Campus, Fatih, Istanbul',
      sourceLabel: 'Official faculty address; coordinates verified from map listing',
      sourceUrl: 'https://cerrahpasatiptanitim.iuc.edu.tr/',
      logoUrl: 'https://cerrahpasatiptanitim.iuc.edu.tr/assets/images/logo/ctf-logo.png',
    },
  ],
];

const locations = new Map<string, VerifiedUniversityLocation>(
  entries.map(([key, value]) => [normalizeUniversityKey(key), value]),
);

export function verifiedUniversityLocation(
  countryCode: string,
  universityName: string,
): VerifiedUniversityLocation | null {
  return locations.get(normalizeUniversityKey(`${countryCode}:${universityName}`)) ?? null;
}

function normalizeUniversityKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ıİ]/g, 'I')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}
