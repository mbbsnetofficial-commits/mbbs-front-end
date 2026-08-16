import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../../../environments/environment';
import { API } from '../constants/api.constants';
import {
  ChatMessagesResponse,
  ChatSessionResponse,
  ChatSessionsResponse,
  CreateChatSessionRequest,
  CustomTestSaveRequest,
  CustomTestSaveResponse,
  GenerateInsightsResponse,
  SendChatMessageResponse,
  StartTestRequest,
  StartTestResponse,
  SubmitTestRequest,
  SubmitTestResponse,
  TestChaptersResponse,
  TestSelectionRequest,
  TestResultResponse,
  TestSubjectsResponse,
  TestTopicsRequest,
  TestTopicsResponse,
  ZoneInsightResponse
} from '../models/quick-test.model';

@Injectable({
  providedIn: 'root'
})
export class QuickTestService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getSubjects() {
    return this.http.get<TestSubjectsResponse>(
      this.baseUrl + API.TEST.SUBJECTS
    );
  }

  getChapters(data: TestSelectionRequest) {
    return this.http.post<TestChaptersResponse>(
      this.baseUrl + API.TEST.CHAPTERS,
      data
    );
  }

  getTopics(data: TestTopicsRequest) {
    return this.http.post<TestTopicsResponse>(
      this.baseUrl + API.TEST.TOPICS,
      data
    );
  }

  saveCustomTest(data: CustomTestSaveRequest) {
    return this.http.post<CustomTestSaveResponse>(
      this.baseUrl + API.TEST.SAVE,
      data
    );
  }

  startTest(data: StartTestRequest) {
    return this.http.post<StartTestResponse>(
      this.baseUrl + API.TEST.START,
      data
    );
  }

  submitTest(data: SubmitTestRequest) {
    return this.http.post<SubmitTestResponse>(
      this.baseUrl + API.TEST.SUBMIT,
      data
    );
  }

  getTestResult(sessionId: string) {
    return this.http.get<TestResultResponse>(
      `${this.baseUrl}${API.TEST.SESSIONS}/${encodeURIComponent(sessionId)}/result`
    );
  }

  listChatSessions(page = 1, limit = 100) {
    return this.http.get<ChatSessionsResponse>(
      this.baseUrl + API.CHAT.SESSIONS,
      { params: { page, limit } }
    );
  }

  createChatSession(data: CreateChatSessionRequest) {
    return this.http.post<ChatSessionResponse>(
      this.baseUrl + API.CHAT.SESSIONS,
      data
    );
  }

  getChatMessages(chatSessionId: string, page = 1, limit = 100) {
    return this.http.get<ChatMessagesResponse>(
      `${this.baseUrl}${API.CHAT.SESSIONS}/${encodeURIComponent(chatSessionId)}/messages`,
      { params: { page, limit } }
    );
  }

  sendChatMessage(chatSessionId: string, message: string) {
    return this.http.post<SendChatMessageResponse>(
      `${this.baseUrl}${API.CHAT.SESSIONS}/${encodeURIComponent(chatSessionId)}/messages`,
      { message }
    );
  }

  generateInsights(chatSessionId: string) {
    return this.http.post<GenerateInsightsResponse>(
      `${this.baseUrl}${API.CHAT.SESSIONS}/${encodeURIComponent(chatSessionId)}/insights`,
      {}
    );
  }

  getZoneInsights(testSessionId: string) {
    return this.http.get<ZoneInsightResponse>(
      `${this.baseUrl}${API.CHAT.ZONE_INSIGHTS}/${encodeURIComponent(testSessionId)}`
    );
  }
}
