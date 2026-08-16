export interface LearningReportCourseName {
  title: string;
  subtitle: string;
}

export interface LearningReportScore {
  earned: number;
  total_marks: number;
  formatted: string;
}

export interface LearningReportItem {
  id: number;
  test_id: number;
  test_code: string;
  test_name: string;
  course_name: LearningReportCourseName;
  source: 'builtin' | 'previous_year';
  type: string;
  level: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  totalMarks?: number;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  time_spent: string;
  timeSpentSeconds: number;
  score: LearningReportScore | null;
  activeSessionId?: string | null;
  active_session_id?: string | null;
  sessionId?: string | null;
  session_id?: string | null;
  lastModifiedAt: string | null;
  date_modified: string;
}

export interface LearningReportPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LearningReportResponse {
  status: string;
  message?: string;
  data: LearningReportItem[];
  pagination: LearningReportPagination;
}

export interface LearningReportQueryParams {
  status?: 'all' | 'not_started' | 'in_progress' | 'completed';
  source?: 'all' | 'builtin' | 'previous_year';
  type?: string;
  sortBy?: 'date' | 'score' | 'progress' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface NeetSummaryData {
  student_id: string;
  total_time_spent_seconds: number;
  total_time_spent: string;
  average_score: string;
  average_score_number: number;
  completed_tests: number;
  current_streak: number;
  streak_formatted: string;
  build_test_cta?: string;
}

export interface NeetSummaryResponse {
  status: string;
  message: string;
  data: NeetSummaryData;
}

