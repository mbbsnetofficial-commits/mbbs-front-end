export type UcatOption = 'A' | 'B' | 'C' | 'D';
export type UcatTestMode = 'QUICK_TEST' | 'CUSTOM_TEST';

export interface UcatApiResponse<T> {
  success?: boolean;
  total?: number;
  data: T;
  message?: string;
}

export type UcatSubjectsResponse = UcatApiResponse<string[]>;

export interface UcatChapter {
  chapter: string;
}

export type UcatChaptersResponse = UcatApiResponse<UcatChapter[]>;

export interface UcatChaptersRequest {
  subjects: string[];
}

export interface UcatTopic {
  _id?: string;
  id?: number | string;
  name: string;
  subject: string;
  icon?: string;
  chapter: string;
}

export type UcatTopicsResponse = UcatApiResponse<UcatTopic[]>;

export interface UcatTopicsRequest {
  subjects: string[];
  chapters: string[];
}

export interface UcatStartTestRequest {
  student_id: string;
  subjects: string[];
  chapters: string[];
  topic_ids: (number | string)[];
  limit: number;
  duration: number;
}

export interface UcatQuestion {
  question_id?: number | string;
  id?: number | string;
  _id?: string;
  question: string;
  option_a: string | number;
  option_b: string | number;
  option_c: string | number;
  option_d: string | number;
  subject?: string;
  topic_name?: string;
  chapter?: string;
}

export interface UcatStartTestResponse {
  success?: boolean;
  sessionId: string;
  duration?: number;
  total_questions?: number;
  totalQuestions?: number;
  status?: string;
  test_type?: string;
  score?: number;
  correct?: number;
  wrong?: number;
  skipped?: number;
  accuracy?: number;
  started_at?: string;
  questions?: UcatQuestion[];
  answers?: UcatSubmitAnswer[];
  data?: UcatQuestion[];
  message?: string;
}

export interface UcatSubmitAnswer {
  question_id: number | string;
  selected_option: UcatOption | string;
  time_spent: number;
}

export interface UcatSubmitTestRequest {
  sessionId: string;
  answers: UcatSubmitAnswer[];
}

export interface UcatResultQuestion {
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
  marks_awarded?: number;
  time_spent?: number;
  isCorrect?: boolean;
  is_correct?: boolean;
  is_skipped?: boolean;
  topic_name?: string;
  subject?: string;
}

export interface UcatTestResult {
  sessionId: string;
  test_type?: string;
  status?: string;
  score: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  total_questions?: number;
  duration?: number;
  subjects?: string[];
  chapters?: string[];
  started_at?: string;
  submitted_at?: string;
  total_time_spent?: number;
  review: UcatResultQuestion[];
}

export type UcatTestResultResponse = UcatApiResponse<UcatTestResult> | UcatTestResult;

export interface UcatSubmitTestResponse {
  success?: boolean;
  score?: number;
  correct?: number;
  wrong?: number;
  skipped?: number;
  accuracy?: number;
  message?: string;
  sessionId?: string;
  data?: UcatTestResult;
}

export interface UcatHistoryItem {
  sessionId: string;
  test_type?: string;
  subjects?: string[];
  chapters?: string[];
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

export interface UcatHistoryData {
  sessions: UcatHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UcatHistoryResponse {
  success?: boolean;
  message?: string;
  data: UcatHistoryData | UcatHistoryItem[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface UcatQuestionState {
  questionId: number | string;
  selectedOption: UcatOption | string | null;
  timeSpent: number;
  visited: boolean;
}

export interface UcatActiveSession {
  sessionId: string;
  durationMinutes: number;
  totalQuestions: number;
  questions: UcatQuestion[];
  questionStates: UcatQuestionState[];
  currentQuestionIndex: number;
  startedAtTimestamp: number;
  test_type?: string;
}
