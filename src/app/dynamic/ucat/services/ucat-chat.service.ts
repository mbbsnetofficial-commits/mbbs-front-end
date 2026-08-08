import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  UcatChatMessagesResponse,
  UcatChatSessionSingleResponse,
  UcatChatSessionsResponse,
  UcatCreateChatSessionRequest,
  UcatSendMessageRequest,
  UcatSendMessageResponse
} from '../models/ucat-chat.model';

@Injectable({
  providedIn: 'root'
})
export class UcatChatService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  /** Get all existing AI review chat sessions for the student */
  getChatSessions(): Observable<UcatChatSessionsResponse> {
    return this.http.get<UcatChatSessionsResponse>(
      `${this.baseUrl}/ucat/chat/sessions`
    );
  }

  /** Create a new AI review chat session linked to a completed UCAT testSessionId */
  createChatSession(
    testSessionId: string,
    title: string
  ): Observable<UcatChatSessionSingleResponse> {
    const payload: UcatCreateChatSessionRequest = { testSessionId, title };
    return this.http.post<UcatChatSessionSingleResponse>(
      `${this.baseUrl}/ucat/chat/sessions`,
      payload
    );
  }

  /** Get chat session metadata by chatSessionId */
  getChatSession(chatSessionId: string): Observable<UcatChatSessionSingleResponse> {
    return this.http.get<UcatChatSessionSingleResponse>(
      `${this.baseUrl}/ucat/chat/sessions/${encodeURIComponent(chatSessionId)}`
    );
  }

  /** Load all conversation messages for a chatSessionId */
  getMessages(chatSessionId: string): Observable<UcatChatMessagesResponse> {
    return this.http.get<UcatChatMessagesResponse>(
      `${this.baseUrl}/ucat/chat/sessions/${encodeURIComponent(chatSessionId)}/messages`
    );
  }

  /** Send a question/content to the AI assistant for a chatSessionId */
  sendMessage(
    chatSessionId: string,
    content: string
  ): Observable<UcatSendMessageResponse> {
    const payload: UcatSendMessageRequest = { content };
    return this.http.post<UcatSendMessageResponse>(
      `${this.baseUrl}/ucat/chat/sessions/${encodeURIComponent(chatSessionId)}/messages`,
      payload
    );
  }
}
