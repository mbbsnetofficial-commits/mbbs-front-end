import { University } from './university.model';

export type InviteStatus =
  | 'PENDING'
  | 'NEW'
  | 'VIEWED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED';

export type DeclineReason =
  | 'TUITION'
  | 'COUNTRY'
  | 'UNIVERSITY'
  | 'INTAKE'
  | 'NOT_INTERESTED'
  | 'OTHER';

export interface ProgramDetails {
  programName: string;
  degree: string;
  duration: string;
  durationYears: number;
  language: string;
  intake: string;
  applicationDeadline: string;
  clinicalRotations: string;
  eligibilityCriteria: string[];
}

export interface FinancialDetails {
  tuitionAnnual: number;
  tuitionTotal: number;
  currency: string;
  scholarshipPercentage: number;
  scholarshipAmount: number;
  netTuitionAnnual: number;
  applicationFee: number;
  estimatedHostelAnnual: number;
  estimatedLivingAnnual: number;
}

export interface StudentEligibilityMatch {
  studentNeetScore: number;
  minNeetScore: number;
  studentAcademicPcb: number;
  minAcademicPcb: number;
  matchPercentage: number;
  matchedFactors: string[];
  reasonsForInvite: string[];
}

export interface Invite {
  id: string;
  inviteNumber?: string;
  universityId: string;
  university: University;
  program: ProgramDetails;
  financial: FinancialDetails;
  eligibility: StudentEligibilityMatch;
  title?: string;
  description?: string;
  invitationMessage?: string;
  status: InviteStatus;
  declineReason?: DeclineReason;
  declineNote?: string;
  issuedAt: string;
  createdAt?: string;
  viewedAt?: string | null;
  respondedAt?: string | null;
  expiresAt: string;
  tags?: string[];
  priorityRank?: number;
}

export interface InviteSummaryCounts {
  total: number;
  pending: number;
  viewed: number;
  accepted: number;
  declined: number;
  expired: number;
  cancelled: number;
  newCount?: number;
  viewedCount?: number;
  acceptedCount?: number;
  declinedCount?: number;
  expiredCount?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
