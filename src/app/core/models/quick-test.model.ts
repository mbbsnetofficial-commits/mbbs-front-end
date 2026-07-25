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

export interface ChatSession {
  _id: string;
  user_id: string;
  test_session_id: string;
  title: string;
  wrong_question_ids: number[];
  is_active: boolean;
  last_message_at: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateChatSessionRequest {
  testSessionId: string;
  title: string;
}

export interface ChatSessionResponse {
  status: string;
  data: ChatSession;
}

export interface ChatSessionsResponse {
  status: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: ChatSession[];
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  _id: string;
  chat_session_id: string;
  user_id: string;
  role: ChatRole;
  content: string;
  model: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatMessagesResponse {
  status: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: ChatMessage[];
}

export interface SendChatMessageResponse {
  status: string;
  data: {
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
  };
}

export interface ZoneInsightTime {
  total_time_spent: number;
  correct_time_spent: number;
  incorrect_time_spent: number;
  skipped_time_spent: number;
}

export interface ZoneInsight {
  _id?: string;
  student_id: string;
  test_session_id: string;
  accuracy: number;
  focus_zone: Record<string, string[]>;
  repeated_mistake: Record<string, string[]>;
  checkpoints: string[];
  g_phrase: string;
  total_mark: number;
  time_spend: ZoneInsightTime;
}

export interface GenerateInsightsResponse {
  status: string;
  message: string;
  data: {
    testSessionId: string;
    chatSessionId: string;
    insight: ZoneInsight;
  };
}

export interface ZoneInsightResponse {
  status: string;
  data: ZoneInsight;
}
