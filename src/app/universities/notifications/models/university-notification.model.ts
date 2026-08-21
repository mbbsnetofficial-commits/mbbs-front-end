export interface UniversityNotification {
  _id: string;
  organizationId?: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UniversityNotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UniversityNotificationListData {
  items: UniversityNotification[];
  pagination: UniversityNotificationPagination;
}

export interface UniversityNotificationListResponse {
  success: boolean;
  message?: string;
  data: UniversityNotificationListData | UniversityNotification[];
}

export interface UniversityUnreadCountData {
  count: number;
}

export interface UniversityUnreadNotificationCountResponse {
  success: boolean;
  message?: string;
  data: UniversityUnreadCountData;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface MarkNotificationReadData {
  _id: string;
  read: boolean;
  readAt?: string;
}

export interface MarkNotificationReadResponse {
  success: boolean;
  message: string;
  data: MarkNotificationReadData;
}

export interface MarkAllNotificationsReadData {
  success: boolean;
  markedCount: number;
}

export interface MarkAllNotificationsReadResponse {
  success: boolean;
  message: string;
  data: MarkAllNotificationsReadData;
}
