export const UNIVERSITY_AUTH_API = {
  LOGIN: '/university/auth/login',
  LOGOUT: '/university/auth/logout',
  RESET_PASSWORD: '/university/auth/reset-password',
} as const;

export const UNIVERSITY_STORAGE_KEYS = {
  ACCESS_TOKEN: 'university_access_token',
  IDENTITY: 'university_identity',
} as const;
