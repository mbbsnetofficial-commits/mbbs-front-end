export interface PersonalInformation {
  fullName: string;
  dob: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  nationality: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
}

export interface AcademicInformation {
  schoolName: string;
  boardName: string;
  tenthYear: number;
  tenthMarks?: number;
  tenthPercentage?: number;
  twelfthYear: number;
  twelfthMarks?: number;
  physicsScore: number;
  chemistryScore: number;
  biologyScore: number;
  englishScore?: number;
  pcbPercentage: number;
  overallPercentage?: number;
}

export interface EntranceExam {
  id: string;
  examType: 'NEET' | 'UCAT' | 'IMAT' | 'MCAT' | 'OTHER';
  year: number;
  rollNumber: string;
  score: number;
  maxScore?: number;
  rank?: number;
  percentile?: number;
  qualified: boolean;
}

export interface MbbsPreferences {
  preferredCourse: string;
  course?: string;
  specialization?: string;
  preferredCountries: string[];
  preferredIntake: string[];
  preferredBudgetUsd?: number;
  preferredLanguage?: string;
  budgetMinInLakhs?: number;
  budgetMaxInLakhs?: number;
  currency: string;
  hostelRequired: boolean;
  scholarshipRequired: boolean;
  preferredDurationYears?: number;
}

export type DocumentType =
  | 'PASSPORT'
  | 'TENTH_CERTIFICATE'
  | 'TWELFTH_CERTIFICATE'
  | 'NEET_SCORECARD'
  | 'PHOTOGRAPH'
  | 'MEDICAL_CERTIFICATE'
  | 'POLICE_CLEARANCE'
  | 'OTHER';

export type DocumentStatus =
  | 'NOT_UPLOADED'
  | 'UPLOADING'
  | 'UPLOADED'
  | 'VERIFIED'
  | 'REJECTED';

export interface StudentDocument {
  id: string;
  type: DocumentType;
  title: string;
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
  status: DocumentStatus;
  fileUrl?: string;
  rejectionReason?: string;
}

export interface SectionCompletionStatus {
  key: 'personal' | 'academic' | 'entrance' | 'preferences' | 'documents';
  title: string;
  isComplete: boolean;
  completedFields: number;
  totalFields: number;
  weight: number;
  routeAnchor: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  avatarUrl: string;
  aspirantTitle: string;
  personal: PersonalInformation;
  academic: AcademicInformation;
  entranceExams: EntranceExam[];
  preferences: MbbsPreferences;
  documents: StudentDocument[];
  completionPercentage: number;
  sections: SectionCompletionStatus[];
  isDiscoverable: boolean;
  discoveryStatusText: string;
  updatedAt: string;
}
