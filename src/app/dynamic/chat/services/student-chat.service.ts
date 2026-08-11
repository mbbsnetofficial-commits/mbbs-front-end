import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface BackendApiResponse<T> {
  status: string;
  message?: string;
  count?: number;
  data: T;
}

export type CommunityConversationType =
  | 'group_university'
  | 'group_country'
  | 'group_batch';

export interface ConversationItem {
  _id: string;
  type: CommunityConversationType;
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
  type: CommunityConversationType;
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

@Injectable({
  providedIn: 'root'
})
export class StudentChatService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.cseApiBaseUrl || 'https://api2.mbbs.net/api/v1'}/chat`;

  getPublicGroups(): Observable<BackendApiResponse<PublicGroupItem[]>> {
    return this.http.get<BackendApiResponse<PublicGroupItem[]>>(
      `${this.baseUrl}/groups/public`
    );
  }

  joinGroup(
    userId: string,
    conversationId: string
  ): Observable<BackendApiResponse<{ conversation_id: string }>> {
    const headers = { 'x-user-id': userId };
    return this.http.post<BackendApiResponse<{ conversation_id: string }>>(
      `${this.baseUrl}/group/join`,
      { userId, conversation_id: conversationId },
      { headers }
    );
  }

  getMessages(
    conversationId: string,
    userId?: string,
    page = 1,
    limit = 100
  ): Observable<BackendApiResponse<ChatMessageItem[]>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    const headers: Record<string, string> = {};

    if (userId) {
      params = params.set('userId', userId);
      headers['x-user-id'] = userId;
    }

    return this.http.get<BackendApiResponse<ChatMessageItem[]>>(
      `${this.baseUrl}/messages/${conversationId}`,
      { params, headers }
    );
  }

  sendMessage(payload: {
    conversation_id: string;
    text: string;
    userId: string;
    sender_info?: { name: string };
    reply_to?: {
      message_id?: string;
      text?: string;
      sender_name?: string;
    };
  }): Observable<BackendApiResponse<ChatMessageItem>> {
    const headers = { 'x-user-id': payload.userId };
    return this.http.post<BackendApiResponse<ChatMessageItem>>(
      `${this.baseUrl}/messages`,
      {
        conversation_id: payload.conversation_id,
        text: payload.text,
        userId: payload.userId,
        sender_id: payload.userId,
        sender_info: payload.sender_info,
        reply_to: payload.reply_to
      },
      { headers }
    );
  }

  editMessage(
    messageId: string,
    text: string,
    userId: string
  ): Observable<BackendApiResponse<ChatMessageItem>> {
    const headers = { 'x-user-id': userId };
    return this.http.patch<BackendApiResponse<ChatMessageItem>>(
      `${this.baseUrl}/messages/${messageId}`,
      { text, userId },
      { headers }
    );
  }

  deleteMessage(
    messageId: string,
    userId: string
  ): Observable<BackendApiResponse<{ deleted: boolean }>> {
    const headers = { 'x-user-id': userId };
    return this.http.delete<BackendApiResponse<{ deleted: boolean }>>(
      `${this.baseUrl}/messages/${messageId}`,
      { headers }
    );
  }

  reportUserOrMessage(payload: {
    reporter_id: string;
    reported_user_id?: string;
    message_id?: string;
    reason: string;
    details?: string;
  }): Observable<BackendApiResponse<{ reported: boolean }>> {
    return this.http.post<BackendApiResponse<{ reported: boolean }>>(
      `${this.baseUrl}/report`,
      payload
    );
  }
}
