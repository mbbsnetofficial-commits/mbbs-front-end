import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

import { environment } from '../../../../environments/environment';
import { ChatMessageItem } from './student-chat.service';

@Injectable({
  providedIn: 'root'
})
export class StudentSocketService {
  private socket: Socket | null = null;
  private readonly messageSubject = new Subject<ChatMessageItem>();

  readonly onMessage$: Observable<ChatMessageItem> =
    this.messageSubject.asObservable();

  connect(userId: string): void {
    if (this.socket?.connected || !userId) {
      return;
    }

    const socketUrl = environment.cseApiBaseUrl
      ? environment.cseApiBaseUrl.replace('/api/v1', '')
      : 'https://api2.mbbs.net';

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      query: { userId },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    this.socket.on('receive_message', (msg: Partial<ChatMessageItem>) => {
      this.messageSubject.next({
        _id: msg._id || `msg_${Date.now()}`,
        conversation_id: msg.conversation_id || '',
        sender_id: msg.sender_id || '',
        sender_name: msg.sender_name || msg.sender_info?.name || 'Student',
        sender_info: msg.sender_info,
        text: msg.text || '',
        reply_to: msg.reply_to,
        is_edited: msg.is_edited,
        is_deleted: msg.is_deleted,
        createdAt: msg.createdAt || new Date().toISOString()
      });
    });
  }

  joinConversation(conversationId: string): void {
    if (this.socket?.connected && conversationId) {
      this.socket.emit('join_conversation', { conversationId });
    }
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
  }): void {
    if (this.socket?.connected) {
      this.socket.emit('send_message', payload);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
