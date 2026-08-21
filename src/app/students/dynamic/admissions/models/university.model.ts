export interface University {
  id: string;
  name: string;
  code: string;
  logoUrl: string;
  coverImageUrl: string;
  country: string;
  countryCode: string;
  city: string;
  rankingGlobal?: number;
  rankingNational?: number;
  recognition: string[];
  foundedYear: number;
  campusType: string;
  overview: string;
  websiteUrl: string;
  badge?: string;
  featuredHighlights: string[];
}
