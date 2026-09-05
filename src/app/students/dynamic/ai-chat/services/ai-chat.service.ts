import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AI_CHAT_API, DEFAULT_WELCOME_MESSAGE } from '../constants/ai-chat.constants';
import { ChatApiResponse, ChatMessage, ChatRequest, GroundedSourcesCount } from '../models/ai-chat.model';

export const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-1',
  sender: 'assistant',
  text: DEFAULT_WELCOME_MESSAGE,
};

export const CHAT_STORAGE_KEY = 'mbbs_knowledge_base_chat_messages';

@Injectable({
  providedIn: 'root',
})
export class AiChatService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.aiChatApiBaseUrl || environment.apiBaseUrl;

  readonly messages = signal<ChatMessage[]>(this.loadStoredMessages());
  readonly lastGroundedSources = signal<GroundedSourcesCount | null>(null);
  readonly loading = signal<boolean>(false);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('mbbs:auth:logout', () => {
        this.clearChat();
      });
    }
  }

  /**
   * Loads saved messages from localStorage if the user is authenticated,
   * otherwise returns the initial welcome message.
   */
  private loadStoredMessages(): ChatMessage[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // If no access token exists, ensure session is clean
        const hasToken =
          localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        if (!hasToken) {
          localStorage.removeItem(CHAT_STORAGE_KEY);
          return [INITIAL_WELCOME_MESSAGE];
        }

        const raw = localStorage.getItem(CHAT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Could not load stored Knowledge Base chat messages:', e);
    }
    return [INITIAL_WELCOME_MESSAGE];
  }

  /**
   * Persists current messages to localStorage.
   */
  private persistMessages(msgs: ChatMessage[]): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(msgs));
      }
    } catch (e) {
      console.warn('Could not persist Knowledge Base chat messages:', e);
    }
  }

  /**
   * Appends a message and saves to persistent storage.
   */
  addMessage(msg: ChatMessage): void {
    this.messages.update((list) => {
      const updated = [...list, msg];
      this.persistMessages(updated);
      return updated;
    });
  }

  setLastGroundedSources(sources: GroundedSourcesCount | null): void {
    this.lastGroundedSources.set(sources);
  }

  setLoading(loading: boolean): void {
    this.loading.set(loading);
  }

  /**
   * Resets the chat history back to the initial welcome message.
   * Invoked upon student logout or when manually restarting the conversation.
   */
  clearChat(): void {
    this.messages.set([INITIAL_WELCOME_MESSAGE]);
    this.lastGroundedSources.set(null);
    this.loading.set(false);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(CHAT_STORAGE_KEY);
      }
    } catch (e) {
      // Ignore
    }
  }

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
