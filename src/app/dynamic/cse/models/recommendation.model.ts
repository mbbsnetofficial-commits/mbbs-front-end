export interface Recommendation {
  id: string;
  universityId: string;
  universityName: string;
  universityLogo: string;
  universityImage: string;
  country: string;
  countryCode: string;
  city: string;
  matchScore: number;
  matchReasons: string[];
  keyHighlights: string[];
  annualTuition: string;
  estimatedTotalCost: string;
  rank: number;
  badge?: 'Top Match' | 'Budget Friendly' | 'High FMGE Rate' | 'Global Exposure' | string;
  status: 'recommended' | 'alternative' | 'reach';
  establishedYear?: number;
  mediumOfInstruction?: string;
  durationYears?: number;
  fmgePassingRate?: string;
}

export interface RecommendationFilter {
  countryCode?: string;
  maxTuition?: number;
  minMatchScore?: number;
  sortBy?: 'matchScore' | 'tuition' | 'rank';
}

export interface RecommendationResponse {
  success: boolean;
  data: Recommendation[];
  message?: string;
}
