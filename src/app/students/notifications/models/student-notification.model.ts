export type StudentNotificationType =
  | 'general'
  | 'system'
  | 'test'
  | 'chatbot'
  | 'account'
  | 'reminder';

export type StudentNotificationPriority = 'low' | 'normal' | 'high';

export interface StudentNotification {
  _id: string;
  user_id: string;
  student_id: string;
  title: string;
  message: string;
  notification_type: StudentNotificationType;
  priority: StudentNotificationPriority;
  action_url?: string | null;
  data?: Record<string, any> | null;
  is_read: boolean;
  read_at?: string | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentNotificationListResponse {
  status: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: StudentNotification[];
}

export interface StudentNotificationUnreadCountResponse {
  status: string;
  data: {
    unread_count: number;
  };
}

export interface StudentNotificationActionResponse {
  status: string;
  message: string;
  data?: StudentNotification;
}

export interface StudentNotificationReadAllResponse {
  status: string;
  message: string;
  data?: {
    updated_count: number;
  };
}

export interface StudentNotificationDismissResponse {
  status: string;
  message: string;
}

export interface StudentNotificationListParams {
  page?: number;
  limit?: number;
  is_read?: boolean;
  notification_type?: string;
}

export interface CreateStudentNotificationPayload {
  title: string;
  message: string;
  notification_type?: StudentNotificationType;
  priority?: StudentNotificationPriority;
  action_url?: string | null;
  data?: Record<string, any>;
}
