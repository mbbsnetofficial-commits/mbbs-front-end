export interface Country {
  _id?: string;
  id: string;
  country_id?: string;
  name: string;
  code: string;
  country_code?: string;
  slug?: string;
  flagUrl?: string;
  heroImage?: string;
  description?: string;
  popularCourses?: string[];
  averageTuitionFee?: string;
  currency?: string;
  livingCost?: string;
  language?: string;
  duration?: string;
  advantages?: string[];
  recognition?: string[];
  isPopular?: boolean;
  totalUniversities?: number;
  is_active?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | string;
  display_order?: number;
}

export interface CountryFilter {
  searchQuery?: string;
  maxTuition?: number;
  popularOnly?: boolean;
}

export interface CountryResponse {
  success: boolean;
  data: Country[];
  message?: string;
}
