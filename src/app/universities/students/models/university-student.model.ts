export interface StudentPersonal {
  fullName?: string | null;
  city?: string | null;
  country?: string | null;
  nationality?: string | null;
}

export interface StudentAcademic {
  tenthMarks?: number | null;
  twelfthMarks?: number | null;
  pcbPercentage?: number | null;
  twelfthBoard?: string | null;
  schoolName?: string | null;
}

export interface StudentEntrance {
  neetScore?: number | null;
  neetYear?: number | null;
  neetQualified?: boolean | null;
  ucatScore?: number | null;
}

export interface StudentPreferences {
  preferredCountries?: string[] | null;
  preferredBudgetUsd?: number | null;
  preferredIntake?: string | null;
  preferredLanguage?: string | null;
  course?: string | null;
}

export interface UniversityStudent {
  studentId: string;
  personal?: StudentPersonal | null;
  academic?: StudentAcademic | null;
  entrance?: StudentEntrance | null;
  preferences?: StudentPreferences | null;
  profileCompletion?: number | null;
  createdAt?: string | null;
  hasActiveInvite?: boolean | null;
  inviteStatus?: 'PENDING' | 'VIEWED' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED' | string | null;
  invitation?: {
    id?: string;
    status?: string;
    subject?: string;
    createdAt?: string;
    isActive?: boolean;
  } | null;
}

export interface StudentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UniversityStudentsData {
  items: UniversityStudent[];
  pagination: StudentPagination;
}

export interface UniversityStudentsResponse {
  success: boolean;
  message?: string;
  data: UniversityStudentsData;
}

export interface UniversityStudentDetailResponse {
  success: boolean;
  message?: string;
  data: UniversityStudent;
}

export type StudentSortBy =
  | 'createdAt'
  | 'profileCompletion'
  | 'neetScore'
  | 'pcbPercentage';

export type StudentSortOrder = 'asc' | 'desc';

export interface StudentDiscoveryFilters {
  page?: number;
  limit?: number;
  search?: string;
  country?: string;
  course?: string;
  minNeetScore?: number;
  minPcb?: number;
  maxBudget?: number;
  profileCompletion?: number;
  sortBy?: StudentSortBy;
  sortOrder?: StudentSortOrder;
}
