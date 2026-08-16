import { TestOption } from './quick-test.model';

export interface MarkingScheme {
  correct: number;
  wrong: number;
  skipped: number;
}

export interface NeetBuiltinTest {
  id: number;
  test_id: number;
  builtin_test_id?: number;
  previous_year_paper_id?: number;
  test_code: string;
  test_name: string;
  test_type: string;
  source: 'builtin' | 'previous_year';
  subject: string;
  total_questions: number;
  total_marks: number;
  duration_minutes: number;
  marking_scheme?: MarkingScheme;
  description: string;
  // Legacy/Compatibility fields
  name?: string;
  uploaded_at?: string;
  source_filename?: string;
  question_count?: number;
  exam_type?: string;
  is_active?: boolean;
  institution_id?: number;
  mapped_question_count?: number;
  mapping_available?: boolean;
}

export interface BuiltinTestsResponse {
  success: boolean;
  total: number;
  data: NeetBuiltinTest[];
  message?: string;
}

export type PreviousYearPaper = NeetBuiltinTest;
export type PreviousYearPapersResponse = BuiltinTestsResponse;

export interface PreviousYearPaperResponse {
  success: boolean;
  data: PreviousYearPaper;
  message?: string;
}

export interface TestStartRequest {
  builtin_test_id?: number;
  test_code?: string;
  previous_year_paper_id?: number;
  custom_test_id?: number;
  platform_test_id?: number;
  subjects?: string[];
  chapters?: string[];
  questionCount?: number;
  duration?: number;
}

export interface TestStartQuestion {
  id: number;
  question: string;
  option_a: string | number;
  option_b: string | number;
  option_c: string | number;
  option_d: string | number;
  difficulty?: string;
  topic_id?: number;
  exam_type?: string;
  institution_test_name?: string;
  institution_id?: number;
  explanation_image?: string | null;
}

export interface TestStartResponse {
  success: boolean;
  sessionId: string;
  duration: number;
  totalQuestions: number;
  totalMarks?: number;
  title?: string;
  subtitle?: string;
  level?: string;
  paper?: {
    id?: number;
    name?: string;
    exam_type?: string;
  };
  data: TestStartQuestion[];
  message?: string;
}

export interface TestSessionAnswer {
  question_id: number;
  selected_option: TestOption | string;
  time_spent?: number;
}

export interface TestSessionData {
  sessionId: string;
  student_id?: string;
  title: string;
  status: string;
  duration: number;
  total_questions: number;
  total_marks?: number;
  progress?: number;
  time_spent_seconds?: number;
  remaining_time_seconds?: number;
  answers: TestSessionAnswer[];
  questions: TestStartQuestion[];
}

export interface TestSessionResponse {
  success: boolean;
  data: TestSessionData;
  message?: string;
}

export interface SaveAnswerRequest {
  question_id?: number;
  selected_option?: TestOption | string | null;
  time_spent?: number;
  answers?: PreviousYearAnswer[];
}

export interface SaveAnswerResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export type PreviousYearQuestion = TestStartQuestion;
export type StartPreviousYearTestRequest = TestStartRequest;
export type StartPreviousYearTestResponse = TestStartResponse;

export interface PreviousYearAnswer {
  question_id: number;
  selected_option: TestOption;
  time_spent: number;
}

export interface SubmitPreviousYearTestRequest {
  sessionId: string;
  answers: PreviousYearAnswer[];
}

export interface PreviousYearReviewItem {
  question_id: number;
  selected: TestOption | '';
  correct_answer: TestOption;
  isCorrect: boolean;
}

export interface SubmitPreviousYearTestResponse {
  success: boolean;
  score: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  review: PreviousYearReviewItem[];
  message?: string;
}

export interface PreviousYearQuestionState {
  questionId: number;
  selectedOption: TestOption | null;
  timeSpent: number;
  markedForReview: boolean;
  visited: boolean;
}

export interface ActivePreviousYearTest {
  sessionId: string;
  paper: Pick<PreviousYearPaper, 'id' | 'name' | 'exam_type'>;
  duration: number;
  totalQuestions: number;
  startedAt: number;
  expiresAt: number;
  questions: PreviousYearQuestion[];
  questionStates: PreviousYearQuestionState[];
  currentQuestionIndex: number;
}

export interface CompletedPreviousYearTest {
  session: ActivePreviousYearTest;
  result: SubmitPreviousYearTestResponse;
}

export interface PreviousYearReviewQuestion {
  question: PreviousYearQuestion;
  result: PreviousYearReviewItem;
  timeSpent: number;
}
