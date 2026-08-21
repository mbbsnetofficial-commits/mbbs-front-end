export type TestOption = 'A' | 'B' | 'C' | 'D';

export interface TestApiResponse<T> {
  success: boolean;
  total?: number;
  data: T;
  message?: string;
}

export type TestSubjectsResponse = TestApiResponse<string[]>;

export interface TestChapter {
  chapter: string | null;
}

export type TestChaptersResponse = TestApiResponse<TestChapter[]>;

export interface TestTopic {
  _id: string;
  id: number;
  name: string;
  subject: string;
  icon?: string;
  chapter: string;
}

export type TestTopicsResponse = TestApiResponse<TestTopic[]>;

export interface TestSelectionRequest {
  subjects: string[];
}

export interface TestTopicsRequest extends TestSelectionRequest {
  chapters: string[];
}

export interface CustomTestSaveRequest {
  title: string;
  subjects: string[];
  chapters: string[];
  topic_ids: number[];
  questionCount: number;
  duration: number;
  level?: string;
}

export interface CustomTestSaveData {
  id: number | string;
  custom_test_id: number | string;
  test_name: string;
  test_code: string;
  source: string;
  type: string;
  subjects: string[];
  chapters: string[];
  total_questions: number;
  total_marks: number;
  duration_minutes: number;
  status: string;
}

export interface CustomTestSaveResponse {
  success: boolean;
  message: string;
  data: CustomTestSaveData;
}

export interface StartTestRequest extends TestTopicsRequest {
  questionCount: number;
  duration: number;
}

export interface TestQuestion {
  id: number;
  question: string;
  option_a: string | number;
  option_b: string | number;
  option_c: string | number;
  option_d: string | number;
  difficulty?: string;
  question_type?: string;
  topic_id: number;
  exam_type?: string;
  institution_test_name?: string;
  institution_id?: number;
}

export interface StartTestResponse {
  success: boolean;
  sessionId: string;
  duration: number;
  totalQuestions: number;
  data: TestQuestion[];
  message?: string;
}

export interface SubmitTestAnswer {
  question_id: number;
  selected_option: TestOption;
  time_spent: number;
}

export interface SubmitTestRequest {
  sessionId: string;
  answers: SubmitTestAnswer[];
}

export interface SubmitTestResponse {
  success: boolean;
  score: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  review: SubmitTestReview[];
  message?: string;
}

export interface SubmitTestReview {
  question_id: number;
  selected: string;
  correct_answer: TestOption;
  isCorrect: boolean;
}

export interface TestResultQuestion extends TestQuestion {
  correct_answer: TestOption;
  explanation: string;
  selected_option: TestOption | '';
  is_correct: boolean;
  marks_awarded: number;
  time_spent: number;
  is_skipped: boolean;
}

export interface TestResult {
  sessionId: string;
  test_type: string;
  previous_year_paper_id: number | null;
  status: string;
  score: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  total_questions: number;
  duration: number;
  started_at: string;
  submitted_at: string;
  total_time_spent: number;
  review: TestResultQuestion[];
}

export type TestResultResponse = TestApiResponse<TestResult>;

export interface TestQuestionState {
  questionId: number;
  selectedOption: TestOption | null;
  timeSpent: number;
  markedForReview: boolean;
  visited: boolean;
}

export interface ActiveTestSession {
  sessionId: string;
  duration: number;
  totalQuestions: number;
  startedAt: number;
  expiresAt: number;
  questions: TestQuestion[];
  questionStates: TestQuestionState[];
  currentQuestionIndex: number;
}
