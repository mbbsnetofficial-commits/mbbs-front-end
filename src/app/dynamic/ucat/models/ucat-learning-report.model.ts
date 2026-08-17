export interface UcatLearningReportCourseName {
  title: string;
  subtitle: string;
}

export interface UcatLearningReportScore {
  earned: number;
  total_marks: number;
  formatted: string;
}

export interface UcatLearningReportItem {
  id: number;
  test_id: number;
  custom_test_id?: number;
  platform_test_id?: number;
  builtin_test_id?: number;
  previous_year_paper_id?: number;
  test_code: string;
  test_name: string;
  course_name: UcatLearningReportCourseName;
  source: 'builtin' | 'previous_year' | 'custom';
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
  score: UcatLearningReportScore | null;
  activeSessionId?: string | null;
  active_session_id?: string | null;
  sessionId?: string | null;
  session_id?: string | null;
  subjects?: string[];
  chapters?: string[];
  topic_ids?: (number | string)[];
  lastModifiedAt: string | null;
  date_modified: string;
}

export interface UcatLearningReportPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UcatLearningReportResponse {
  status: string;
  message?: string;
  data: UcatLearningReportItem[];
  pagination: UcatLearningReportPagination;
}

export interface UcatLearningReportQueryParams {
  status?: 'all' | 'not_started' | 'in_progress' | 'completed';
  source?: 'all' | 'builtin' | 'previous_year' | 'custom';
  type?: string;
  sortBy?: 'date' | 'score' | 'progress' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface UcatSummaryData {
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

export interface UcatSummaryResponse {
  status: string;
  message: string;
  data: UcatSummaryData;
}
