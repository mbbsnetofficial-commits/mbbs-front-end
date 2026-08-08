export type QuestionType =
  | 'single-choice'
  | 'multi-choice'
  | 'range'
  | 'text'
  | 'dropdown';

export type ApiQuestionType =
  | 'SINGLE_SELECT'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'MULTI_SELECT'
  | 'TEXT'
  | 'SUBJECT_MARKS'
  | 'single-choice'
  | 'multi-choice'
  | 'text'
  | 'range'
  | 'dropdown';

export interface SubjectMarks {
  english?: number | null;
  chemistry?: number | null;
  biology?: number | null;
  physics?: number | null;
  mathematics?: number | null;
}

export interface QuestionValidation {
  min?: number;
  max?: number;
}

export interface QuestionOptionItem {
  id?: string;
  label: string;
  value: string | number | boolean;
  description?: string;
  badge?: string;
  icon?: string;
}

export interface CseCountryQuestion {
  _id?: string;
  id?: string;
  country_id?: string;
  question_key: string;
  question?: string;
  title?: string;
  question_text?: string;
  subtitle?: string;
  type: ApiQuestionType;
  required?: boolean;
  order?: number;
  validation?: QuestionValidation;
  options?: (QuestionOptionItem | string)[];
  placeholder?: string;
  status?: string;
}

export interface QuestionOption {
  id: string;
  label: string;
  value: string | number;
  description?: string;
  icon?: string;
  badge?: string;
}

export interface Question {
  id: string;
  step: number;
  title: string;
  subtitle?: string;
  type: QuestionType;
  options?: QuestionOption[];
  min?: number;
  max?: number;
  stepSize?: number;
  unit?: string;
  placeholder?: string;
  required?: boolean;
}

export interface UserAnswer {
  questionId: string;
  value: any;
}

export interface StudentDetails {
  fullName: string;
  email: string;
  phone: string;
  neetScore?: number;
  class12Percentage?: number;
  preferredBudget?: string;
  targetYear?: string;
  city?: string;
  notes?: string;
}
