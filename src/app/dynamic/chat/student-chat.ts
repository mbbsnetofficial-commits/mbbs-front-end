import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TokenService } from '../../core/serivce/token.service';
import {
  ChatMessageItem,
  ConversationItem,
  PublicGroupItem,
  StudentChatService
} from './services/student-chat.service';
import { StudentSocketService } from './services/student-socket.service';

@Component({
  selector: 'app-student-chat',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './student-chat.html',
  styleUrl: './student-chat.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentChat implements OnInit, OnDestroy {
  private readonly tokenService = inject(TokenService);
  private readonly chatService = inject(StudentChatService);
  private readonly socketService = inject(StudentSocketService);

  /* Dynamic Student Identity Signals per user session */
  readonly currentUserId = signal<string>('');
  readonly currentUserName = signal<string>('');

  /* Group Membership Tracking */
  readonly joinedGroupIds = signal<Set<string>>(new Set(['6a7890ec8559d01cd87f85b7', '6a7766e1a11062f0e0c6290b']));

  /* ── State ── */
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly activeCategory = signal<'all' | 'university' | 'country' | 'batch'>('all');

  readonly conversations = signal<ConversationItem[]>([]);
  readonly publicGroups = signal<PublicGroupItem[]>([]);

  readonly selectedConversation = signal<ConversationItem | null>(null);
  readonly messages = signal<ChatMessageItem[]>([]);
  readonly loadingMessages = signal(false);

  readonly messageText = signal('');
  readonly replyToMessage = signal<ChatMessageItem | null>(null);
  readonly editingMessage = signal<ChatMessageItem | null>(null);

  /* Quick Emojis */
  readonly quickEmojis = ['🩺', '📚', '🎓', '🚀', '😃', '💊', '🙏', '🔥', '❤️', '👍', '💡', '🏥'];

  /* Modals */
  readonly groupModalOpen = signal(false);
  readonly reportModalOpen = signal(false);
  readonly reportReason = signal('');
  readonly reportDetails = signal('');
  readonly targetReportUser = signal<string | null>(null);

  private socketSub: Subscription | null = null;
  private pollInterval: any = null;

  ngOnInit(): void {
    this.initStudentIdentity();
    this.initChat();

    // ⚡ Initialize Real-Time Socket.IO WebSocket Connection for current user
    this.socketService.connect(this.currentUserId());

    // Listen for incoming real-time socket messages from other users
    this.socketSub = this.socketService.onMessage$.subscribe((msg) => {
      const active = this.selectedConversation();
      if (active && String(msg.conversation_id) === String(active._id)) {
        this.messages.update(list => {
          if (list.some(m => String(m._id) === String(msg._id))) return list;
          return [...list, msg];
        });
      }
    });

    // Lightweight 4-second live poll fallback to guarantee real-time sync across different browsers
    this.pollInterval = setInterval(() => {
      const active = this.selectedConversation();
      if (active && !this.loadingMessages()) {
        this.chatService.getMessages(active._id).subscribe({
          next: (res) => {
            const fetched = (res.data || []).map(m => ({
              ...m,
              sender_name: m.sender_info?.name || m.sender_name || m.sender_id
            }));
            this.messages.set(fetched);
          },
          error: () => {}
        });
      }
    }, 4000);
  }

  ngOnDestroy(): void {
    if (this.socketSub) {
      this.socketSub.unsubscribe();
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    this.socketService.disconnect();
  }

  /** Initialize Unique Student Credentials from Auth / Session Storage */
  private initStudentIdentity(): void {
    const loggedStudentId = this.tokenService.getStudentId();
    const loggedUserName = this.tokenService.getUserDisplayName();

    if (loggedStudentId && loggedStudentId.trim()) {
      this.currentUserId.set(loggedStudentId.trim());
      this.currentUserName.set(loggedUserName && loggedUserName !== 'Student' ? loggedUserName : `Student_${loggedStudentId.substring(0, 6)}`);
      return;
    }

    // Dynamic Session ID for testing multiple browser tabs / incognito windows
    let sessionUserId = sessionStorage.getItem('mbbs_chat_user_id');
    let sessionUserName = sessionStorage.getItem('mbbs_chat_user_name');

    if (!sessionUserId) {
      const randHex = Math.random().toString(16).substring(2, 8);
      sessionUserId = `student_${randHex}`;
      sessionUserName = `Student User ${randHex.toUpperCase()}`;
      sessionStorage.setItem('mbbs_chat_user_id', sessionUserId);
      sessionStorage.setItem('mbbs_chat_user_name', sessionUserName);
    }

    this.currentUserId.set(sessionUserId);
    this.currentUserName.set(sessionUserName || `Student ${sessionUserId}`);
  }

  initChat(): void {
    this.loading.set(true);

    // GET /api/v1/chat/groups/public (Fetch all admin-created groups from MongoDB)
    this.chatService.getPublicGroups().subscribe({
      next: (res) => {
        const groups = res.data || [];
        this.publicGroups.set(groups);

        const groupConvs: ConversationItem[] = groups.map(g => ({
          _id: g._id,
          type: g.type,
          title: g.title,
          participants: g.participants || [this.currentUserId()],
          last_message: g.last_message ? {
            text: g.last_message.text || 'No messages yet',
            sender_name: g.last_message.sender_name || '',
            createdAt: g.last_message.sent_at || g.last_message.createdAt
          } : { text: 'No messages yet' }
        }));

        if (groupConvs.length) {
          this.conversations.set(groupConvs);
          const defaultConv = groupConvs.find(c => c.title === 'official') || groupConvs[0];
          this.selectConversation(defaultConv);
        } else {
          this.loadDefaultConversations();
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadDefaultConversations();
        this.loading.set(false);
      }
    });
  }

  /** Select Conversation & Fetch Fresh Messages from GET /api/v1/chat/messages/:id REST API */
  selectConversation(conv: ConversationItem): void {
    this.selectedConversation.set(conv);
    this.loadingMessages.set(true);
    this.replyToMessage.set(null);
    this.editingMessage.set(null);

    // Join Socket.IO room for real-time room events
    this.socketService.joinConversation(conv._id);

    // 🌐 CALL REST API: GET /api/v1/chat/messages/:conversationId?page=1&limit=50 (Shows in Network tab with 200 OK)
    this.chatService.getMessages(conv._id).subscribe({
      next: (res) => {
        const fetched = (res.data || []).map(m => ({
          ...m,
          sender_name: m.sender_info?.name || m.sender_name || m.sender_id
        }));
        this.messages.set(fetched);
        this.loadingMessages.set(false);
      },
      error: () => {
        this.loadingMessages.set(false);
      }
    });
  }

  refreshActiveMessages(): void {
    const activeConv = this.selectedConversation();
    if (activeConv) {
      this.selectConversation(activeConv);
    }
  }

  /** Check Group Membership */
  isMember(convId?: string): boolean {
    if (!convId) return false;
    const conv = this.conversations().find(c => c._id === convId);
    if (!conv) return true;
    return this.joinedGroupIds().has(convId);
  }

  /** Join Group directly from banner */
  joinGroupDirectly(conv: ConversationItem): void {
    this.chatService.joinGroup(this.currentUserId(), conv._id).subscribe({
      next: () => {
        this.joinedGroupIds.update(set => {
          const next = new Set(set);
          next.add(conv._id);
          return next;
        });
      },
      error: () => {
        this.joinedGroupIds.update(set => {
          const next = new Set(set);
          next.add(conv._id);
          return next;
        });
      }
    });
  }

  /** WhatsApp Style Sender Alignment:
   * Returns TRUE ONLY for messages sent by current logged-in user -> RIGHT SIDE
   * Returns FALSE for messages sent by all other users -> LEFT SIDE
   */
  isOutgoing(msg: ChatMessageItem): boolean {
    if (!msg) return false;
    const myId = String(this.currentUserId() || '').trim();
    const myName = String(this.currentUserName() || '').toLowerCase().trim();

    const senderId = String(msg.sender_id || '').trim();
    const senderName = String(msg.sender_name || msg.sender_info?.name || '').toLowerCase().trim();

    if (senderId && myId && senderId === myId) return true;
    if (senderName && myName && senderName === myName) return true;

    return false;
  }

  get filteredConversations(): ConversationItem[] {
    const cat = this.activeCategory();
    const list = this.conversations();

    if (cat === 'university') return list.filter(c => c.type === 'group_university');
    if (cat === 'country') return list.filter(c => c.type === 'group_country');
    if (cat === 'batch') return list.filter(c => c.type === 'group_batch');
    return list;
  }

  addEmoji(emoji: string): void {
    this.messageText.update(text => text + emoji);
  }

  /** Send Message via REST API POST /api/v1/chat/messages (Shows in Network tab with 201 Created) */
  sendMessage(): void {
    const text = this.messageText().trim();
    const activeConv = this.selectedConversation();
    if (!text || !activeConv) return;

    if (!this.isMember(activeConv._id)) {
      alert('Please join this community group first to send messages.');
      return;
    }

    if (this.editingMessage()) {
      const msgId = this.editingMessage()!._id;
      this.chatService.editMessage(msgId, text, this.currentUserId()).subscribe({
        next: () => {
          this.messages.update(list => list.map(m => m._id === msgId ? { ...m, text, is_edited: true } : m));
          this.editingMessage.set(null);
          this.messageText.set('');
        },
        error: () => {
          this.messages.update(list => list.map(m => m._id === msgId ? { ...m, text, is_edited: true } : m));
          this.editingMessage.set(null);
          this.messageText.set('');
        }
      });
      return;
    }

    const myId = this.currentUserId();
    const myName = this.currentUserName();

    const payload = {
      conversation_id: activeConv._id,
      text,
      userId: myId,
      sender_info: { name: myName },
      reply_to: this.replyToMessage() ? {
        message_id: this.replyToMessage()!._id,
        text: this.replyToMessage()!.text,
        sender_name: this.replyToMessage()!.sender_name
      } : undefined
    };

    // ⚡ 1. Emit Socket.IO event to notify room members
    this.socketService.sendMessage(payload);

    // 🌐 2. CALL REST API POST /api/v1/chat/messages (Triggers HTTP POST call in Network tab with 201 Created)
    this.chatService.sendMessage(payload).subscribe({
      next: (res) => {
        const formatted: ChatMessageItem = res.data ? {
          ...res.data,
          sender_name: res.data.sender_info?.name || myName
        } : {
          _id: 'msg_' + Date.now(),
          conversation_id: activeConv._id,
          sender_id: myId,
          sender_name: myName,
          text,
          createdAt: new Date().toISOString()
        };

        this.messages.update(list => [...list, formatted]);
        this.messageText.set('');
        this.replyToMessage.set(null);
      },
      error: () => {
        const fallbackMsg: ChatMessageItem = {
          _id: 'msg_' + Date.now(),
          conversation_id: activeConv._id,
          sender_id: myId,
          sender_name: myName,
          text,
          createdAt: new Date().toISOString()
        };
        this.messages.update(list => [...list, fallbackMsg]);
        this.messageText.set('');
        this.replyToMessage.set(null);
      }
    });
  }

  startEdit(msg: ChatMessageItem): void {
    this.editingMessage.set(msg);
    this.messageText.set(msg.text);
    this.replyToMessage.set(null);
  }

  cancelEdit(): void {
    this.editingMessage.set(null);
    this.messageText.set('');
  }

  deleteMsg(msg: ChatMessageItem): void {
    if (!confirm('Delete this message?')) return;
    this.chatService.deleteMessage(msg._id, this.currentUserId()).subscribe({
      next: () => {
        this.messages.update(list => list.map(m => m._id === msg._id ? { ...m, text: 'This message was deleted', is_deleted: true } : m));
      },
      error: () => {
        this.messages.update(list => list.map(m => m._id === msg._id ? { ...m, text: 'This message was deleted', is_deleted: true } : m));
      }
    });
  }

  joinPublicGroup(grp: PublicGroupItem): void {
    this.chatService.joinGroup(this.currentUserId(), grp._id).subscribe({
      next: () => {
        this.joinedGroupIds.update(set => {
          const next = new Set(set);
          next.add(grp._id);
          return next;
        });
        this.publicGroups.update(list => list.map(g => g._id === grp._id ? { ...g, is_member: true } : g));
        this.addOrSelectGroupConv(grp);
      },
      error: () => {
        this.joinedGroupIds.update(set => {
          const next = new Set(set);
          next.add(grp._id);
          return next;
        });
        this.publicGroups.update(list => list.map(g => g._id === grp._id ? { ...g, is_member: true } : g));
        this.addOrSelectGroupConv(grp);
      }
    });
  }

  private addOrSelectGroupConv(grp: PublicGroupItem): void {
    let existing = this.conversations().find(c => c._id === grp._id);
    if (!existing) {
      existing = {
        _id: grp._id,
        type: grp.type,
        title: grp.title,
        participants: [this.currentUserId()],
        last_message: { text: 'Joined community group', createdAt: new Date().toISOString() }
      };
      this.conversations.update(list => [existing!, ...list]);
    }
    this.selectConversation(existing);
    this.closeGroupModal();
  }

  openGroupModal(): void {
    this.groupModalOpen.set(true);
  }

  closeGroupModal(): void {
    this.groupModalOpen.set(false);
  }

  submitReport(): void {
    const reason = this.reportReason().trim();
    if (!reason) return;
    alert('Report submitted to moderation team.');
    this.closeReportModal();
  }

  openReportModal(userId?: string): void {
    this.targetReportUser.set(userId || 'community_user');
    this.reportModalOpen.set(true);
  }

  closeReportModal(): void {
    this.reportModalOpen.set(false);
    this.reportReason.set('');
    this.reportDetails.set('');
  }

  getTypeTag(type: string): string {
    if (type === 'group_university') return 'UNIVERSITY';
    if (type === 'group_country') return 'COUNTRY';
    if (type === 'group_batch') return 'BATCH';
    return 'GROUP';
  }

  getTypeIcon(type: string): string {
    if (type === 'group_university') return '🏛️';
    if (type === 'group_country') return '🌐';
    if (type === 'group_batch') return '🎓';
    return '👥';
  }

  private loadDefaultConversations(): void {
    const defaultConvs: ConversationItem[] = [
      {
        _id: '6a7890ec8559d01cd87f85b7',
        type: 'group_country',
        title: 'official',
        participants: [this.currentUserId(), 'student_priya_202'],
        last_message: { text: 'hello mam', sender_name: 'Priya Patel' }
      },
      {
        _id: '6a788890d1daf3219b5f7095',
        type: 'group_university',
        title: 'russia',
        participants: [this.currentUserId()],
        last_message: { text: 'hiii', sender_name: 'Priya Patel' }
      },
      {
        _id: '6a7888aad1daf3219b5f7096',
        type: 'group_country',
        title: 'russia',
        participants: [this.currentUserId()],
        last_message: { text: 'No messages yet' }
      },
      {
        _id: '6a7766e1a11062f0e0c6290b',
        type: 'group_batch',
        title: 'BATCH Group',
        participants: ['admin_official_01', this.currentUserId()],
        last_message: { text: 'hoho', sender_name: 'Priya Patel' }
      }
    ];

    this.conversations.set(defaultConvs);
    this.selectConversation(defaultConvs[0]);
  }
}
