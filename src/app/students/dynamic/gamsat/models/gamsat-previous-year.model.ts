export interface GamsatPreviousYearPaper {
  id: string | number;
  paperId?: string | number;
  paper_id?: string | number;
  numericId?: number;
  name?: string;
  title?: string;
  questionCount?: number;
  question_count?: number;
  durationMinutes?: number;
  duration?: number;
  total_marks?: number;
  examType?: string;
  section?: string;
  isActive?: boolean;
  source_filename?: string;
  uploadedAt?: string;
  uploaded_at?: string;
  description?: string;
  // Student-enrichment fields returned by getPapers() when called with a student ID
  status?: string;
  statusLabel?: string;
  isCompleted?: boolean;
  progress?: number;
  score?: string | number | null;
  rawScore?: number | null;
  accuracy?: string | null;
  timeSpent?: number;
  timeSpentFormatted?: string;
  action?: string;
  actionLabel?: string;
  sessionId?: string | null;
  latestSessionId?: string | null;
  dateModified?: string | null;
}

export interface GamsatPreviousYearPapersResponse {
  success: boolean;
  message?: string;
  data: GamsatPreviousYearPaper[];
}

export interface GamsatPreviousYearPaperDetailResponse {
  success: boolean;
  message?: string;
  data: GamsatPreviousYearPaper;
}

export interface GamsatStartPreviousYearTestRequest {
  limit?: number;
  duration?: number;
}

export interface GamsatPreviousYearSubmitAnswer {
  questionId: number | string;
  answer?: string;
  timeSpent?: number;
}

export interface GamsatPreviousYearSubmitRequest {
  sessionId: string;
  answers: GamsatPreviousYearSubmitAnswer[];
}
