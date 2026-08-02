export interface UcatInsightsData {
  _id?: string;
  testSessionId: string;
  userId?: number | string;
  insightsSummary: string;
  overallAccuracy: number;
  strongSections: string[];
  weakSections: string[];
  recommendedFocusTopics: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UcatInsightsResponse {
  success?: boolean;
  message?: string;
  data: UcatInsightsData;
}

export interface UcatGenerateInsightsRequest {
  testSessionId: string;
}
