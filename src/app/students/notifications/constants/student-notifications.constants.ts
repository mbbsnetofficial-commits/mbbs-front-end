export const STUDENT_NOTIFICATIONS_API = {
  LIST: '/notifications',
  UNREAD_COUNT: '/notifications/unread-count',
  MARK_READ: (notificationId: string) =>
    `/notifications/${encodeURIComponent(notificationId)}/read`,
  MARK_ALL_READ: '/notifications/read-all',
  DELETE: (notificationId: string) =>
    `/notifications/${encodeURIComponent(notificationId)}`,
  CREATE: '/notifications',
} as const;
