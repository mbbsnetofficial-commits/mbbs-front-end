export type UcatActivityType =
  | 'PRACTICE_TEST'
  | 'PREVIOUS_YEAR_PAPER'
  | 'MOCK_TEST'
  | 'DAILY_CHALLENGE'
  | 'MINI_QUIZ'
  | string;

export interface UcatStreakHistoryItem {
  _id?: string;
  date: string;
  activityType: UcatActivityType;
}

export interface UcatStreakData {
  _id?: string;
  userId?: number | string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  history: UcatStreakHistoryItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UcatStreakResponse {
  success?: boolean;
  message?: string;
  data: UcatStreakData;
}

export interface UcatRecordStreakRequest {
  activityType: UcatActivityType;
}
