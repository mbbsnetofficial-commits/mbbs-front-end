export interface GroundedSourcesCount {
  countries: number;
  universities: number;
  courses: number;
  courseRequirements: number;
  countryQuestions: number;
  sources: number;
}

export interface ChatRequest {
  prompt: string;
}

export interface ChatApiData {
  prompt: string;
  response: string;
  groundedSourcesCount: GroundedSourcesCount;
}

export interface ChatApiResponse {
  success: boolean;
  data: ChatApiData;
  message?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  groundedSourcesCount?: GroundedSourcesCount;
  isError?: boolean;
}
