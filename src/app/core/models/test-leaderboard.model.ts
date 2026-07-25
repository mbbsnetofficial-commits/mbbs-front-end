export interface TestLeaderboardEntry {
  rank: number;
  student_id: string;
  total_questions: number;
  test_type: string;
  previous_year_paper_id: number | null;
  score: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  submitted_at: string;
  total_time_spent: number;
  normalized_score: number;
  session_id: string;
  student_name: string;
}

export interface TestLeaderboardQuery {
  testType: string;
  previousYearPaperId?: number;
  period: string;
  page: number;
  limit: number;
}

export interface TestLeaderboardResponse {
  success: boolean;
  message: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  period: string;
  data: TestLeaderboardEntry[];
}

export interface MyTestRankResponse {
  success: boolean;
  message: string;
  period: string;
  data: TestLeaderboardEntry | null;
}
