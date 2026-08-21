export const UNIVERSITY_NOTIFICATIONS_API = {
  LIST: '/organization/notifications',
  UNREAD_COUNT: '/organization/notifications/unread-count',
  MARK_READ: (notificationId: string) =>
    `/organization/notifications/${encodeURIComponent(notificationId)}/read`,
  MARK_ALL_READ: '/organization/notifications/read-all',
} as const;
