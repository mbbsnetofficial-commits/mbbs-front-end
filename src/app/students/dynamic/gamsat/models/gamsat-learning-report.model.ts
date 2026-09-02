export interface GamsatLearningReportCourseName {
  title: string;
  subtitle?: string;
}

export interface GamsatLearningReportScore {
  earned?: number;
  total_marks?: number;
  formatted?: string;
}

export interface GamsatLearningReportKpi {
  totalPracticeTime?: number;
  totalPracticeTimeFormatted?: string;
  averageScore?: number | string;
  completedTests?: number;
  currentStreak?: number;
  averageAccuracy?: number;
}

export interface GamsatLearningReportItem {
  id?: string | number;
  sessionId?: string | null;
  session_id?: string | null;
  activeSessionId?: string | null;
  active_session_id?: string | null;
  dateModified?: string;
  date_modified?: string;
  lastModifiedAt?: string | null;
  completedAt?: string | null;
  completed_at?: string | null;
  submittedAt?: string | null;
  submitted_at?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  testName?: string;
  test_name?: string;
  test_code?: string;
  testCode?: string;
  test_id?: number;
  testId?: number;
  custom_test_id?: number | string;
  platform_test_id?: number | string;
  builtin_test_id?: number | string;
  previous_year_paper_id?: number | string;
  paperId?: string | number;
  paper_id?: string | number;
  course_name?: GamsatLearningReportCourseName;
  source?: 'builtin' | 'previous_year' | 'custom' | string;
  type?: string;
  level?: string;
  difficulty?: string;
  duration_minutes?: number;
  durationMinutes?: number;
  total_questions?: number;
  totalQuestions?: number;
  answeredQuestions?: number;
  answered_questions?: number;
  answeredCount?: number;
  attempted?: number;
  answered?: number;
  total_marks?: number;
  totalMarks?: number;
  status?: string;
  progress?: number;
  timeSpent?: number;
  timeSpentFormatted?: string;
  time_spent?: string;
  timeSpentSeconds?: number;
  score?: string | GamsatLearningReportScore | number | null;
  rawScore?: number;
  accuracy?: string | number;
  action?: string;
  sections?: string[];
  units?: string[];
  topic_ids?: (number | string)[];
}

export interface GamsatLearningReportPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GamsatLearningReportData {
  kpi?: GamsatLearningReportKpi;
  tests?: GamsatLearningReportItem[];
  pagination?: GamsatLearningReportPagination;
}

export interface GamsatLearningReportResponse {
  success?: boolean;
  status?: string;
  message?: string;
  data?: GamsatLearningReportData | GamsatLearningReportItem[];
  pagination?: GamsatLearningReportPagination;
}

export interface GamsatLearningReportQueryParams {
  status?: 'all' | 'not_started' | 'in_progress' | 'completed';
  source?: 'all' | 'builtin' | 'previous_year' | 'custom';
  type?: string;
  section?: string;
  sortBy?: 'date' | 'score' | 'progress' | 'title' | 'time';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface GamsatLearningReportFilters {
  statuses?: string[];
  sources?: string[];
  sections?: string[];
  types?: string[];
  difficulties?: string[];
  timeframes?: string[];
}

export interface GamsatLearningReportFiltersResponse {
  success?: boolean;
  status?: string;
  message?: string;
  data?: GamsatLearningReportFilters;
}

export interface GamsatSummaryData {
  student_id?: string;
  totalPracticeTime?: number;
  totalPracticeTimeFormatted?: string;
  total_time_spent_seconds?: number;
  total_time_spent?: string;
  averageRawScore?: number;
  averageScore?: number | string;
  average_score?: string;
  average_score_number?: number;
  completedTests?: number;
  completed_tests?: number;
  currentStreak?: number;
  current_streak?: number;
  longestStreak?: number;
  longest_streak?: number;
  totalTests?: number;
  averageAccuracy?: number;
  streak_formatted?: string;
  build_test_cta?: string;
}

export interface GamsatSummaryResponse {
  success?: boolean;
  status?: string;
  message?: string;
  data: GamsatSummaryData;
}
