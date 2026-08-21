export const UNIVERSITY_INVITES_API = {
  CREATE: '/organization/invites',
  LIST: '/organization/invites',
  DETAIL: (inviteId: string) =>
    `/organization/invites/${encodeURIComponent(inviteId)}`,
  CANCEL: (inviteId: string) =>
    `/organization/invites/${encodeURIComponent(inviteId)}/cancel`,
} as const;
