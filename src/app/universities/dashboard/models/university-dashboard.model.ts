export interface RecentInvite {
  _id: string;
  studentId: string;
  subject: string;
  status: string;
  createdAt: string;
}

export interface RecentActivity {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface DashboardSummary {
  totalStudents: number;
  studentsViewed: number;
  invitesSent: number;
  pendingInvites: number;
  acceptedInvites: number;
  declinedInvites: number;
  recentInvites: RecentInvite[];
  recentActivity: RecentActivity[];
}

export interface DashboardSummaryResponse {
  success: boolean;
  message?: string;
  data: DashboardSummary;
}
