import { HttpClient, HttpParams } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface BackendApiResponse<T> {
  status: string;
  message?: string;
  count?: number;
  data: T;
}

export interface ConversationItem {
  _id: string;
  type: 'direct' | 'group_university' | 'group_country' | 'group_batch';
  title?: string;
  participants: string[];
  last_message?: {
    text: string;
    sender_name?: string;
    sent_at?: string;
    createdAt?: string;
  };
  unread_count?: number;
  created_at?: string;
}

export interface PublicGroupItem {
  _id: string;
  type: 'group_university' | 'group_country' | 'group_batch';
  title: string;
  country_id?: string;
  university_id?: string;
  batch_year?: string;
  member_count: number;
  is_member?: boolean;
  participants?: string[];
  last_message?: {
    text?: string;
    sender_name?: string;
    sent_at?: string;
    createdAt?: string;
  };
}

export interface ChatMessageItem {
  _id: string;
  conversation_id: string;
  sender_id: string;
  sender_name?: string;
  sender_info?: {
    name: string;
    email?: string;
    avatar?: string;
  };
  text: string;
  reply_to?: {
    message_id?: string;
    text?: string;
    sender_name?: string;
  };
  is_edited?: boolean;
  is_deleted?: boolean;
  createdAt: string;
}

export interface UserPresenceResponse {
  userId: string;
  is_online: boolean;
  last_seen: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudentChatService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.cseApiBaseUrl || 'https://api2.mbbs.net/api/v1'}/chat`;

  /** GET /api/v1/chat/settings */
  getChatSettings(): Observable<BackendApiResponse<{ direct_chat_enabled: boolean }>> {
    return this.http.get<BackendApiResponse<{ direct_chat_enabled: boolean }>>(`${this.baseUrl}/settings`);
  }

  /** GET /api/v1/chat/conversations?userId={userId} */
  getUserConversations(userId: string): Observable<BackendApiResponse<ConversationItem[]>> {
    const params = new HttpParams().set('userId', userId);
    const headers = { 'x-user-id': userId };
    return this.http.get<BackendApiResponse<ConversationItem[]>>(`${this.baseUrl}/conversations`, { params, headers });
  }

  /** GET /api/v1/chat/groups/public */
  getPublicGroups(): Observable<BackendApiResponse<PublicGroupItem[]>> {
    return this.http.get<BackendApiResponse<PublicGroupItem[]>>(`${this.baseUrl}/groups/public`);
  }

  /** POST /api/v1/chat/group/join */
  joinGroup(userId: string, conversation_id: string): Observable<BackendApiResponse<any>> {
    const headers = { 'x-user-id': userId };
    return this.http.post<BackendApiResponse<any>>(`${this.baseUrl}/group/join`, { userId, conversation_id }, { headers });
  }

  /** POST /api/v1/chat/direct */
  getOrCreateDirectChat(userId: string, targetUserId: string): Observable<BackendApiResponse<ConversationItem>> {
    const headers = { 'x-user-id': userId };
    return this.http.post<BackendApiResponse<ConversationItem>>(`${this.baseUrl}/direct`, { userId, targetUserId }, { headers });
  }

  /** GET /api/v1/chat/messages/{conversationId}?page=1&limit=50 */
  getMessages(conversationId: string, userId?: string, page = 1, limit = 50): Observable<BackendApiResponse<ChatMessageItem[]>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    const headers: Record<string, string> = {};
    if (userId) {
      params = params.set('userId', userId);
      headers['x-user-id'] = userId;
    }
    return this.http.get<BackendApiResponse<ChatMessageItem[]>>(`${this.baseUrl}/messages/${conversationId}`, { params, headers });
  }

  /** POST /api/v1/chat/messages */
  sendMessage(payload: { conversation_id: string; text: string; userId: string; sender_info?: any; reply_to?: any }): Observable<BackendApiResponse<ChatMessageItem>> {
    const headers = { 'x-user-id': payload.userId };
    const body = {
      conversation_id: payload.conversation_id,
      text: payload.text,
      userId: payload.userId,
      sender_id: payload.userId,
      sender_info: payload.sender_info,
      reply_to: payload.reply_to
    };
    return this.http.post<BackendApiResponse<ChatMessageItem>>(`${this.baseUrl}/messages`, body, { headers });
  }

  /** PATCH /api/v1/chat/messages/{messageId} */
  editMessage(messageId: string, text: string, userId: string): Observable<BackendApiResponse<ChatMessageItem>> {
    const headers = { 'x-user-id': userId };
    return this.http.patch<BackendApiResponse<ChatMessageItem>>(`${this.baseUrl}/messages/${messageId}`, { text, userId }, { headers });
  }

  /** DELETE /api/v1/chat/messages/{messageId} */
  deleteMessage(messageId: string, userId: string): Observable<BackendApiResponse<any>> {
    const headers = { 'x-user-id': userId };
    return this.http.delete<BackendApiResponse<any>>(`${this.baseUrl}/messages/${messageId}`, { headers });
  }

  /** GET /api/v1/chat/presence/{userId} */
  getUserPresence(userId: string): Observable<BackendApiResponse<UserPresenceResponse>> {
    return this.http.get<BackendApiResponse<UserPresenceResponse>>(`${this.baseUrl}/presence/${userId}`);
  }

  /** GET /api/v1/chat/search?q={query} */
  searchConversations(userId: string, query: string): Observable<BackendApiResponse<any[]>> {
    const params = new HttpParams().set('userId', userId).set('q', query);
    return this.http.get<BackendApiResponse<any[]>>(`${this.baseUrl}/search`, { params });
  }

  /** POST /api/v1/chat/block */
  blockUser(userId: string, targetUserId: string, reason?: string): Observable<BackendApiResponse<any>> {
    return this.http.post<BackendApiResponse<any>>(`${this.baseUrl}/block`, { userId, targetUserId, reason });
  }

  /** POST /api/v1/chat/unblock */
  unblockUser(userId: string, targetUserId: string): Observable<BackendApiResponse<any>> {
    return this.http.post<BackendApiResponse<any>>(`${this.baseUrl}/unblock`, { userId, targetUserId });
  }

  /** GET /api/v1/chat/blocked */
  getBlockedUsers(userId: string): Observable<BackendApiResponse<any[]>> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<BackendApiResponse<any[]>>(`${this.baseUrl}/blocked`, { params });
  }

  /** POST /api/v1/chat/report */
  reportUserOrMessage(payload: { reporter_id: string; reported_user_id?: string; message_id?: string; reason: string; details?: string }): Observable<BackendApiResponse<any>> {
    return this.http.post<BackendApiResponse<any>>(`${this.baseUrl}/report`, payload);
  }
}
