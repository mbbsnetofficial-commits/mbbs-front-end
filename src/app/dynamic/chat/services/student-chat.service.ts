import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ChatSettingsResponse {
  success: boolean;
  settings?: {
    direct_chat_enabled: boolean;
  };
}

export interface ConversationItem {
  _id: string;
  type: 'direct' | 'group_university' | 'group_country' | 'group_batch';
  title?: string;
  participants: {
    userId: string;
    name?: string;
    role?: string;
    avatar?: string;
  }[];
  last_message?: {
    text: string;
    createdAt: string;
    sender_name?: string;
  };
  unread_count?: number;
  updatedAt?: string;
}

export interface ChatMessageItem {
  _id: string;
  conversation_id: string;
  sender_id: string;
  sender_name?: string;
  text: string;
  is_edited?: boolean;
  is_deleted?: boolean;
  reply_to?: {
    message_id: string;
    text: string;
    sender_name?: string;
  };
  createdAt: string;
}

export interface PublicGroupItem {
  _id: string;
  title: string;
  type: 'group_university' | 'group_country' | 'group_batch';
  university_id?: string;
  country_id?: string;
  batch_year?: string;
  member_count?: number;
  is_member?: boolean;
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
  getChatSettings(): Observable<ChatSettingsResponse> {
    return this.http.get<ChatSettingsResponse>(`${this.baseUrl}/settings`);
  }

  /** GET /api/v1/chat/conversations?userId={userId} */
  getUserConversations(userId: string): Observable<{ success: boolean; conversations: ConversationItem[] }> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<{ success: boolean; conversations: ConversationItem[] }>(`${this.baseUrl}/conversations`, { params });
  }

  /** GET /api/v1/chat/groups/public */
  getPublicGroups(): Observable<{ success: boolean; groups: PublicGroupItem[] }> {
    return this.http.get<{ success: boolean; groups: PublicGroupItem[] }>(`${this.baseUrl}/groups/public`);
  }

  /** POST /api/v1/chat/group/join */
  joinGroup(userId: string, conversation_id: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/group/join`, { userId, conversation_id });
  }

  /** POST /api/v1/chat/direct */
  getOrCreateDirectChat(userId: string, targetUserId: string): Observable<{ success: boolean; conversation: ConversationItem }> {
    return this.http.post<{ success: boolean; conversation: ConversationItem }>(`${this.baseUrl}/direct`, { userId, targetUserId });
  }

  /** GET /api/v1/chat/messages/{conversationId}?page=1&limit=50 */
  getMessages(conversationId: string, page = 1, limit = 50): Observable<{ success: boolean; messages: ChatMessageItem[] }> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<{ success: boolean; messages: ChatMessageItem[] }>(`${this.baseUrl}/messages/${conversationId}`, { params });
  }

  /** POST /api/v1/chat/messages */
  sendMessage(payload: { conversation_id: string; text: string; userId?: string; reply_to?: any }): Observable<{ success: boolean; message: ChatMessageItem }> {
    const headers = { 'x-user-id': payload.userId || 'user_student_101' };
    return this.http.post<{ success: boolean; message: ChatMessageItem }>(`${this.baseUrl}/messages`, payload, { headers });
  }

  /** PATCH /api/v1/chat/messages/{messageId} */
  editMessage(messageId: string, text: string): Observable<{ success: boolean; message: ChatMessageItem }> {
    return this.http.patch<{ success: boolean; message: ChatMessageItem }>(`${this.baseUrl}/messages/${messageId}`, { text });
  }

  /** DELETE /api/v1/chat/messages/{messageId} */
  deleteMessage(messageId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/messages/${messageId}`);
  }

  /** GET /api/v1/chat/presence/{userId} */
  getUserPresence(userId: string): Observable<UserPresenceResponse> {
    return this.http.get<UserPresenceResponse>(`${this.baseUrl}/presence/${userId}`);
  }

  /** GET /api/v1/chat/search?userId={userId}&q={query} */
  searchConversations(userId: string, query: string): Observable<{ success: boolean; results: ChatMessageItem[] }> {
    const params = new HttpParams().set('userId', userId).set('q', query);
    return this.http.get<{ success: boolean; results: ChatMessageItem[] }>(`${this.baseUrl}/search`, { params });
  }

  /** POST /api/v1/chat/block */
  blockUser(userId: string, targetUserId: string, reason?: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/block`, { userId, targetUserId, reason });
  }

  /** POST /api/v1/chat/unblock */
  unblockUser(userId: string, targetUserId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/unblock`, { userId, targetUserId });
  }

  /** GET /api/v1/chat/blocked?userId={userId} */
  getBlockedUsers(userId: string): Observable<{ success: boolean; blocked_users: any[] }> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<{ success: boolean; blocked_users: any[] }>(`${this.baseUrl}/blocked`, { params });
  }

  /** POST /api/v1/chat/report */
  reportUserOrMessage(payload: { reporter_id: string; reported_user_id: string; message_id?: string; conversation_id?: string; reason: string; details?: string }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/report`, payload);
  }
}
