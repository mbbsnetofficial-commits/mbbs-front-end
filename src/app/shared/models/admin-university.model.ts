export interface AdminCountry {
  _id: string;
  name: string;
  slug: string;
  country_code: string;
  currency?: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  display_order: number;
}

export interface AdminUniversity {
  _id: string;
  country_id: string;
  name: string;
  short_name?: string;
  type?: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  locations?: Array<{
    state?: string;
    cities?: string[];
  }>;
  official_website?: string;
  description?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
}

export interface GroupedCountryUniversities {
  countryId: string;
  countryName: string;
  countryCode: string;
  displayOrder: number;
  universities: AdminUniversity[];
}
