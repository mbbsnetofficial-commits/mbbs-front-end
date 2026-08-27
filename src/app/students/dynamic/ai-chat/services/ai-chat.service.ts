import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AI_CHAT_API } from '../constants/ai-chat.constants';
import { ChatApiResponse, ChatRequest } from '../models/ai-chat.model';

@Injectable({
  providedIn: 'root',
})
export class AiChatService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.aiChatApiBaseUrl || environment.apiBaseUrl;

  /**
   * Sends a user prompt to the backend Knowledge Base AI Chat API.
   * POST /api/v1/knowledge-base/chat
   * Body: { prompt: string }
   */
  sendMessage(prompt: string): Observable<ChatApiResponse> {
    const payload: ChatRequest = { prompt };
    const url = `${this.baseUrl}${AI_CHAT_API.CHAT}`;
    return this.http.post<ChatApiResponse>(url, payload);
  }
}
