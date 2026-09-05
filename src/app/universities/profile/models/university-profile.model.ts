export interface UniversityProfile {
  organizationId: string;
  name: string;
  code: string;
  country: string;
  city: string;
  logo?: string | null;
  coverImage?: string | null;
  banner?: string | null;
  description: string;
  website?: string | null;
  contactEmail: string;
  contactPhone?: string | null;
  address?: string | null;
  accreditations?: string[];
  worldRanking?: number | null;
  tuitionFeeMinUsd?: number | null;
  tuitionFeeMaxUsd?: number | null;
  scholarshipAmount?: number | null;
  otherFees?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UniversityProfileResponse {
  success: boolean;
  message?: string;
  data: UniversityProfile;
}

export interface UpdateUniversityProfileRequest {
  name: string;
  country: string;
  city: string;
  description: string;
  website?: string | null;
  contactEmail: string;
  contactPhone?: string | null;
  address?: string | null;
  logo?: string | null;
  coverImage?: string | null;
  banner?: string | null;
  tuitionFeeMinUsd?: number | null;
  tuitionFeeMaxUsd?: number | null;
  scholarshipAmount?: number | null;
  otherFees?: number | null;
  accreditations?: string[];
}

export interface UpdateUniversityProfileResponse {
  success: boolean;
  message: string;
  data: UniversityProfile;
}
