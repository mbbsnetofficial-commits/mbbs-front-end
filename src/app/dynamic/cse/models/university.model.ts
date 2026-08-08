export interface FeeStructure {
  year: number;
  tuitionFee: number;
  hostelFee: number;
  otherExpenses: number;
  currency: string;
}

export interface University {
  id: string;
  name: string;
  slug: string;
  country: string;
  countryCode: string;
  city: string;
  establishedYear: number;
  type: 'Public' | 'Private' | 'Government';
  logo: string;
  coverImage: string;
  gallery: string[];
  description: string;
  overviewHtml?: string;
  ranking: {
    world: number;
    national: number;
  };
  accreditations: string[];
  mediumOfInstruction: string;
  durationYears: number;
  tuitionFeePerYear: number;
  hostelFeePerYear: number;
  currency: string;
  eligibilityCriteria: string[];
  fmgePassingRate: string;
  usmlePreparation: boolean;
  features: string[];
  admissionDeadline: string;
  feeBreakdown?: FeeStructure[];
}

export interface UniversityResponse {
  success: boolean;
  data: University[];
  message?: string;
}
