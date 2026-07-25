import { TestOption } from './quick-test.model';

export interface PreviousYearPaper {
  id: number;
  name: string;
  uploaded_at: string;
  source_filename: string;
  question_count: number;
  exam_type: string;
  is_active: boolean;
  institution_id: number;
  mapped_question_count: number;
  mapping_available: boolean;
}

export interface PreviousYearPapersResponse {
  success: boolean;
  total: number;
  data: PreviousYearPaper[];
  message?: string;
}

export interface PreviousYearPaperResponse {
  success: boolean;
  data: PreviousYearPaper;
  message?: string;
}

export interface PreviousYearQuestion {
  id: number;
  question: string;
  option_a: string | number;
  option_b: string | number;
  option_c: string | number;
  option_d: string | number;
  topic_id: number;
  exam_type?: string;
  institution_test_name?: string;
  institution_id?: number;
  explanation_image?: string | null;
}

export interface StartPreviousYearTestRequest {
  duration: number;
}

export interface StartPreviousYearTestResponse {
  success: boolean;
  sessionId: string;
  paper: Pick<PreviousYearPaper, 'id' | 'name' | 'exam_type'>;
  duration: number;
  totalQuestions: number;
  data: PreviousYearQuestion[];
  message?: string;
}

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
