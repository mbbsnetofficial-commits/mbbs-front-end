export interface CancelInvitationData {
  _id: string;
  status: string;
  cancelledAt: string;
}

export interface CancelInvitationResponse {
  success: boolean;
  message: string;
  data: CancelInvitationData;
}

// API #8: Create / Send Invitation
export interface CreateInvitePayload {
  studentId: string;
  subject: string;
  message?: string;
  course?: string;
  tuitionFeeUsd?: number;
  intake?: string;
  validUntil?: string;
  resend?: boolean;
  override?: boolean;
}

export interface CreatedInviteData {
  _id: string;
  studentId: string;
  organizationId?: string;
  subject: string;
  message?: string;
  course?: string;
  tuitionFeeUsd?: number;
  status: string;
  createdAt: string;
}

export interface CreateInviteResponse {
  success: boolean;
  message?: string;
  data: CreatedInviteData;
}

// API #9: Organization Invites List
export interface OrganizationInviteStudentSummary {
  fullName?: string | null;
  city?: string | null;
  country?: string | null;
  neetScore?: number | null;
  pcbPercentage?: number | null;
}

export interface OrganizationInviteItem {
  _id: string;
  studentId: string;
  organizationId?: string;
  subject: string;
  message?: string;
  course?: string;
  tuitionFeeUsd?: number;
  status: string;
  createdAt: string;
  cancelledAt?: string | null;
  student?: OrganizationInviteStudentSummary | null;
}

export interface OrganizationInvitesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrganizationInvitesData {
  items: OrganizationInviteItem[];
  pagination: OrganizationInvitesPagination;
}

export interface OrganizationInvitesResponse {
  success: boolean;
  message?: string;
  data: OrganizationInvitesData;
}

export interface OrganizationInvitesFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrganizationInviteDetailResponse {
  success: boolean;
  message?: string;
  data: OrganizationInviteItem;
}

