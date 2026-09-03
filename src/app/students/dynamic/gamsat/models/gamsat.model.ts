export interface GamsatApiResponse<T> {
  success: boolean;
  status?: string;
  message?: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type GamsatSection = 'SECTION_I' | 'SECTION_II' | 'SECTION_III' | string;
export type GamsatOption = 'A' | 'B' | 'C' | 'D';
export type GamsatDifficulty = 'easy' | 'medium' | 'hard';
export type GamsatQuestionStatus = 'UNANSWERED' | 'ANSWERED' | 'MARKED_FOR_REVIEW' | 'SKIPPED';

export interface GamsatSectionOption {
  id?: string;
  code?: string;
  name?: string;
  title?: string;
  description?: string;
}

export type GamsatSectionsResponse = GamsatApiResponse<any>;

export interface GamsatTopic {
  id?: number | string;
  _id?: number | string;
  name: string;
  section?: GamsatSection;
  unit?: string;
  questionCount?: number;
  description?: string;
}

export interface GamsatTopicsRequest {
  section?: string;
  sections?: string[];
  unit?: string;
}

export type GamsatTopicsResponse = GamsatApiResponse<GamsatTopic[]>;

export interface GamsatFiltersData {
  sections?: string[];
  difficulties?: string[];
  types?: string[];
  tags?: string[];
}

export type GamsatFiltersResponse = GamsatApiResponse<GamsatFiltersData>;

export interface GamsatQuestionQueryParams {
  section?: string;
  topic_id?: number | string;
  difficulty?: string;
  limit?: number;
  page?: number;
}

export interface GamsatQuestion {
  id: number | string;
  question_id?: number | string;
  questionId?: number | string;
  _id?: number | string;
  question: string;
  stimulus_text?: string;
  stimulus_image?: string | null;
  stimulus_title?: string;
  section?: GamsatSection;
  unit?: string;
  topic_id?: number | string;
  topic_name?: string;
  difficulty?: GamsatDifficulty | string;
  option_a: string | number;
  option_b: string | number;
  option_c: string | number;
  option_d: string | number;
  options?: string[];
  correct_answer?: GamsatOption | string;
  explanation?: string;
  marks?: number;
  total_marks?: number;
  duration_minutes?: number;
}

export interface GamsatBuiltinTest {
  id: number | string;
  builtin_test_id?: number | string;
  test_id?: number | string;
  test_code?: string;
  title?: string;
  name?: string;
  test_name?: string;
  test_type?: string;
  section?: GamsatSection | string;
  unit_name?: string;
  difficulty?: GamsatDifficulty | string;
  total_questions?: number;
  duration_minutes?: number;
  total_marks?: number;
  created_at?: string;
  description?: string;
  sections?: string[];
}

export interface GamsatBuiltinTestsResponse {
  success: boolean;
  message?: string;
  data: GamsatBuiltinTest[];
}

export interface GamsatCustomTestTopicConfig {
  topic_id: number | string;
  question_count: number;
}

export interface GamsatCreateCustomTestRequest {
  title: string;
  name?: string;
  section?: GamsatSection;
  sections?: string[];
  difficulty?: GamsatDifficulty | string;
  topics?: (number | string)[] | GamsatCustomTestTopicConfig[];
  topic_ids?: (number | string)[];
  total_questions?: number;
  duration_minutes?: number;
  questionCount?: number;
  duration?: number;
  level?: string;
}

export type GamsatCustomTestSaveRequest = GamsatCreateCustomTestRequest;

export interface GamsatCustomTestConfigData {
  id?: number | string;
  test_id?: number | string;
  custom_test_id?: number | string;
  name?: string;
  title?: string;
  sections?: string[];
  topicIds?: number[];
  topic_ids?: (number | string)[];
  questionCount?: number;
  total_questions?: number;
  difficulty?: string;
  durationMinutes?: number;
  duration_minutes?: number;
  duration?: number;
  availableQuestions?: number;
}

export interface GamsatSaveCustomTestResponse {
  success: boolean;
  message?: string;
  data?: GamsatCustomTestConfigData;
}

export type GamsatCustomTestSaveResponse = GamsatSaveCustomTestResponse;

export interface GamsatStartTestRequest {
  title?: string;
  name?: string;
  test_id?: number | string;
  custom_test_id?: number | string;
  platform_test_id?: number | string;
  builtin_test_id?: number | string;
  previous_year_paper_id?: number | string;
  test_type?: 'BUILTIN' | 'CUSTOM' | 'PREVIOUS_YEAR' | string;
  duration?: number;
  duration_minutes?: number;
  total_questions?: number;
  questionCount?: number;
  limit?: number;
  sections?: string[];
  topics?: (number | string)[];
  topic_ids?: (number | string)[];
  difficulty?: string;
  level?: string;
}

export interface GamsatStartTestData {
  sessionId: string;
  paperId?: string | number;
  testName?: string;
  testType?: string;
  test_type?: string;
  totalQuestions?: number;
  total_questions?: number;
  durationMinutes?: number;
  duration_minutes?: number;
  duration?: number;
  startedAt?: string | number;
  expiresAt?: string | number;
  remainingTimeSeconds?: number;
  status?: string;
  questions?: GamsatQuestion[];
}

export interface GamsatStartTestResponse {
  success?: boolean;
  sessionId?: string;
  paperId?: string | number;
  testName?: string;
  testType?: string;
  test_type?: string;
  duration?: number;
  durationMinutes?: number;
  duration_minutes?: number;
  total_questions?: number;
  totalQuestions?: number;
  status?: string;
  score?: number;
  correct?: number;
  wrong?: number;
  skipped?: number;
  accuracy?: number;
  started_at?: string;
  startedAt?: string | number;
  expiresAt?: string | number;
  remainingTimeSeconds?: number;
  questions?: GamsatQuestion[];
  answers?: GamsatSubmitAnswer[];
  data?: GamsatStartTestData | GamsatQuestion[];
  message?: string;
}

export interface GamsatSubmitAnswer {
  question_id?: number | string;
  questionId?: number | string;
  selected_option?: GamsatOption | string | null;
  answer?: string;
  time_spent?: number;
  timeSpent?: number;
}

export interface GamsatSaveAnswerRequest {
  questionId?: number | string;
  selectedOption?: GamsatOption | string | null;
  timeSpent?: number;
  question_id?: number | string;
  selected_option?: GamsatOption | string | null;
  time_spent?: number;
  answers?: GamsatSubmitAnswer[];
}

export interface GamsatSaveAnswerResponse {
  success?: boolean;
  message?: string;
  data?: any;
}

export interface GamsatSubmitTestRequest {
  sessionId: string;
  answers: GamsatSubmitAnswer[];
}

export interface GamsatResultQuestion {
  question_id?: number | string;
  id?: number | string;
  question: string;
  option_a: string | number;
  option_b: string | number;
  option_c: string | number;
  option_d: string | number;
  selected_option?: string | null;
  selected?: string | null;
  correct_answer: string;
  explanation?: string;
  stimulus_text?: string;
  stimulus_image?: string | null;
  stimulus_title?: string;
  marks_awarded?: number;
  time_spent?: number;
  isCorrect?: boolean;
  is_correct?: boolean;
  is_skipped?: boolean;
  topic_name?: string;
  section?: string;
  unit?: string;
}

export interface GamsatTestResult {
  sessionId: string;
  test_type?: string;
  testType?: string;
  testId?: string | number;
  testName?: string;
  status?: string;
  score?: number | string;
  rawScore?: number;
  maximumRawScore?: number;
  correct?: number;
  wrong?: number;
  incorrect?: number;
  skipped?: number;
  accuracy?: number;
  percentage?: number;
  total_questions?: number;
  totalQuestions?: number;
  attempted?: number;
  duration?: number;
  sections?: string[];
  started_at?: string;
  submitted_at?: string;
  total_time_spent?: number;
  timeSpent?: number;
  questions?: GamsatResultQuestion[];
  review: GamsatResultQuestion[];
}

export type GamsatTestResultResponse = GamsatApiResponse<GamsatTestResult> | GamsatTestResult;

export interface GamsatSubmitTestResponse {
  success?: boolean;
  score?: number | string;
  rawScore?: number;
  maximumRawScore?: number;
  correct?: number;
  wrong?: number;
  incorrect?: number;
  skipped?: number;
  accuracy?: number;
  percentage?: number;
  totalQuestions?: number;
  message?: string;
  sessionId?: string;
  data?: GamsatTestResult;
  result?: GamsatTestResult;
}

export interface GamsatHistoryItem {
  sessionId: string;
  test_type?: string;
  sections?: string[];
  duration?: number;
  score?: number;
  accuracy?: number;
  correct?: number;
  wrong?: number;
  skipped?: number;
  status: 'Completed' | 'In Progress' | string;
  started_at?: string;
  submitted_at?: string;
}

export interface GamsatHistoryData {
  sessions: GamsatHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GamsatHistoryResponse {
  success?: boolean;
  message?: string;
  data: GamsatHistoryData | GamsatHistoryItem[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface GamsatQuestionState {
  questionId: number | string;
  selectedOption: GamsatOption | string | null;
  timeSpent: number;
  markedForReview?: boolean;
  visited: boolean;
}

export interface GamsatActiveSession {
  sessionId: string;
  paperId?: string | number;
  testName?: string;
  durationMinutes?: number;
  duration_minutes?: number;
  duration?: number;
  totalQuestions?: number;
  total_questions?: number;
  startedAt?: string | number;
  expiresAt?: string | number;
  remainingTimeSeconds?: number;
  status?: string;
  questions: GamsatQuestion[];
  questionStates?: GamsatQuestionState[];
  currentQuestionIndex?: number;
  startedAtTimestamp?: number;
  test_type?: string;
  testType?: string;
}
