export interface UcatPreviousYearPaper {
  id: number;
  paper_id: string;
  name: string;
  question_count: number;
  duration: number;
  total_marks: number;
  source_filename?: string;
  uploaded_at?: string;
}

export interface UcatPreviousYearPapersResponse {
  success: boolean;
  message?: string;
  data: UcatPreviousYearPaper[];
}

export interface UcatStartPreviousYearTestRequest {
  limit?: number;
  duration?: number;
}
