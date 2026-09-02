export type GamsatActivityType =
  | 'PRACTICE_TEST'
  | 'PREVIOUS_YEAR_PAPER'
  | 'MOCK_TEST'
  | 'MINI_QUIZ'
  | string;

export interface GamsatStreakHistoryItem {
  _id?: string;
  date: string;
  activityType: GamsatActivityType;
}

export interface GamsatStreakData {
  _id?: string;
  userId?: number | string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  history: GamsatStreakHistoryItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GamsatStreakResponse {
  success?: boolean;
  message?: string;
  data: GamsatStreakData;
}

export interface GamsatRecordStreakRequest {
  activityType: GamsatActivityType;
}
