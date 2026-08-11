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

  readonly onMessage$: Observable<ChatMessageItem> = this.messageSubject.asObservable();

  connect(userId: string): void {
    if (this.socket && this.socket.connected) {
      return;
    }

    const socketUrl = environment.cseApiBaseUrl ? environment.cseApiBaseUrl.replace('/api/v1', '') : 'https://api2.mbbs.net';

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      query: { userId },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('⚡ Socket connected:', this.socket?.id);
    });

    this.socket.on('receive_message', (msg: any) => {
      const formatted: ChatMessageItem = {
        _id: msg._id || 'msg_' + Date.now(),
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id || msg.userId,
        sender_name: msg.sender_info?.name || msg.sender_name || 'Student',
        sender_info: msg.sender_info,
        text: msg.text,
        reply_to: msg.reply_to,
        createdAt: msg.createdAt || new Date().toISOString()
      };
      this.messageSubject.next(formatted);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('Socket connect error:', err.message);
    });
  }

  joinConversation(conversationId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_conversation', { conversationId }, (ack: any) => {
        console.log('Joined socket room:', conversationId, ack);
      });
    }
  }

  sendMessage(payload: { conversation_id: string; text: string; userId: string; sender_info?: any; reply_to?: any }): void {
    if (this.socket && this.socket.connected) {
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
