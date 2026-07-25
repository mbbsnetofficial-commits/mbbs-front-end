export interface QodResponse {
  status: string;
  data: QodQuestion;
}

export interface QodQuestion {
  id: number;
  question_date: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  difficulty: string;
  question_type: string;
  topic_id: number;
  alreadyAnswered: boolean;
}

export interface SubmitQodRequest {
  question_id: number;
  selected_option: string;
}

export interface SubmitQodResponse {
  status: string;
  message: string;
  data: {
    question_id: number;
    selected_option: string;
    correct_answer: string;
    is_correct: boolean;
    explanation: string;
  };
}