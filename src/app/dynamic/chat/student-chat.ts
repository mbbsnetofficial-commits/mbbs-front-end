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

  /* Dynamic Student Identity Signals (Different ID per student login / session) */
  readonly currentUserId = signal<string>('6a63554e323b3e70a7c0f9d5');
  readonly currentUserName = signal<string>('Student STU1784894798825OBDD4J');

  /* ── State ── */
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly directChatEnabled = signal(true);

  readonly activeCategory = signal<'all' | 'direct' | 'university' | 'country' | 'batch'>('all');

  readonly conversations = signal<ConversationItem[]>([]);
  readonly publicGroups = signal<PublicGroupItem[]>([]);
  readonly blockedUsers = signal<any[]>([]);

  readonly selectedConversation = signal<ConversationItem | null>(null);
  readonly messages = signal<ChatMessageItem[]>([]);
  readonly loadingMessages = signal(false);

  readonly messageText = signal('');
  readonly replyToMessage = signal<ChatMessageItem | null>(null);
  readonly editingMessage = signal<ChatMessageItem | null>(null);

  /* Quick Emojis */
  readonly quickEmojis = ['🩺', '📚', '🎓', '🚀', '😃', '💊', '🙏', '🔥', '❤️', '👍', '💡', '🏥'];

  /* Modals */
  readonly directModalOpen = signal(false);
  readonly targetDirectUserId = signal('');

  readonly groupModalOpen = signal(false);

  readonly reportModalOpen = signal(false);
  readonly reportReason = signal('');
  readonly reportDetails = signal('');
  readonly targetReportUser = signal<string | null>(null);

  private socketSub: Subscription | null = null;

  /* In-Memory Conversation Message Store */
  private readonly conversationMessageMap = new Map<string, ChatMessageItem[]>();

  ngOnInit(): void {
    this.initStudentIdentity();
    this.seedDefaultHistoryMap();
    this.initChat();

    // ⚡ Initialize Real-Time Socket.IO WebSocket Connection with dynamic student ID
    this.socketService.connect(this.currentUserId());

    // Listen for incoming real-time socket messages
    this.socketSub = this.socketService.onMessage$.subscribe((msg) => {
      const convId = msg.conversation_id;
      const currentList = this.conversationMessageMap.get(convId) || [];
      if (!currentList.some(m => m._id === msg._id)) {
        const updatedList = [...currentList, msg];
        this.conversationMessageMap.set(convId, updatedList);

        if (this.selectedConversation()?._id === convId) {
          this.messages.set(updatedList);
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.socketSub) {
      this.socketSub.unsubscribe();
    }
    this.socketService.disconnect();
  }

  /** Initialize Unique Student Credentials from Auth / Session Storage */
  private initStudentIdentity(): void {
    const loggedStudentId = this.tokenService.getStudentId();
    const loggedUserName = this.tokenService.getUserDisplayName();

    if (loggedStudentId && loggedStudentId.trim()) {
      this.currentUserId.set(loggedStudentId.trim());
      this.currentUserName.set(loggedUserName && loggedUserName !== 'Student' ? loggedUserName : `Student STU_${loggedStudentId.substring(0, 6).toUpperCase()}`);
      return;
    }

    // Dynamic Multi-Session ID for testing multiple browser tabs / incognito windows
    let sessionUserId = sessionStorage.getItem('mbbs_chat_session_user_id');
    let sessionUserName = sessionStorage.getItem('mbbs_chat_session_user_name');

    if (!sessionUserId) {
      const randHex = Math.random().toString(16).substring(2, 10);
      sessionUserId = `student_${randHex}`;
      sessionUserName = `Student STU_${randHex.toUpperCase()}`;
      sessionStorage.setItem('mbbs_chat_session_user_id', sessionUserId);
      sessionStorage.setItem('mbbs_chat_session_user_name', sessionUserName);
    }

    this.currentUserId.set(sessionUserId);
    this.currentUserName.set(sessionUserName || `Student STU_${sessionUserId.substring(0, 6).toUpperCase()}`);
  }

  initChat(): void {
    this.loading.set(true);

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
    this.loading.set(false);
  }

  selectConversation(conv: ConversationItem): void {
    this.selectedConversation.set(conv);
    this.replyToMessage.set(null);
    this.editingMessage.set(null);

    // Join Socket.IO room for real-time WebSocket messaging
    this.socketService.joinConversation(conv._id);

    const history = this.conversationMessageMap.get(conv._id) || [];
    this.messages.set(history);
  }

  refreshActiveMessages(): void {
    const activeConv = this.selectedConversation();
    if (activeConv) {
      const history = this.conversationMessageMap.get(activeConv._id) || [];
      this.messages.set([...history]);
    }
  }

  /** WhatsApp Style Sender Alignment:
   * Returns TRUE ONLY for messages sent by the current logged-in user -> RIGHT SIDE
   * Returns FALSE for messages from all other users -> LEFT SIDE
   */
  isOutgoing(msg: ChatMessageItem): boolean {
    if (!msg) return false;
    const myId = this.currentUserId();
    const myName = this.currentUserName().toLowerCase().trim();

    const senderId = String(msg.sender_id || '');
    const senderName = String(msg.sender_name || msg.sender_info?.name || '').toLowerCase().trim();

    if (senderId && myId && senderId === myId) return true;
    if (senderName && myName && (senderName === myName || senderName.includes(myId))) return true;

    return false;
  }

  // Filtered Conversations List
  get filteredConversations(): ConversationItem[] {
    const cat = this.activeCategory();
    const list = this.conversations();

    if (cat === 'direct') return list.filter(c => c.type === 'direct');
    if (cat === 'university') return list.filter(c => c.type === 'group_university');
    if (cat === 'country') return list.filter(c => c.type === 'group_country');
    if (cat === 'batch') return list.filter(c => c.type === 'group_batch');
    return list;
  }

  // Quick Emoji Insertion
  addEmoji(emoji: string): void {
    this.messageText.update(text => text + emoji);
  }

  // Send Message via Socket.IO WebSocket with Dynamic Student Credentials
  sendMessage(): void {
    const text = this.messageText().trim();
    const activeConv = this.selectedConversation();
    if (!text || !activeConv) return;

    if (this.editingMessage()) {
      const msgId = this.editingMessage()!._id;
      this.messages.update(list => list.map(m => m._id === msgId ? { ...m, text, is_edited: true } : m));
      this.editingMessage.set(null);
      this.messageText.set('');
      return;
    }

    const myId = this.currentUserId();
    const myName = this.currentUserName();

    const newMsg: ChatMessageItem = {
      _id: 'msg_' + Date.now(),
      conversation_id: activeConv._id,
      sender_id: myId,
      sender_name: myName,
      text,
      reply_to: this.replyToMessage() ? {
        message_id: this.replyToMessage()!._id,
        text: this.replyToMessage()!.text,
        sender_name: this.replyToMessage()!.sender_name
      } : undefined,
      createdAt: new Date().toISOString()
    };

    const payload = {
      conversation_id: activeConv._id,
      text,
      userId: myId,
      sender_info: { name: myName },
      reply_to: newMsg.reply_to
    };

    // ⚡ 1. Emit real-time WebSocket event
    this.socketService.sendMessage(payload);

    // ⚡ 2. Render outgoing message locally on RIGHT side
    const currentHistory = this.conversationMessageMap.get(activeConv._id) || [];
    const updatedHistory = [...currentHistory, newMsg];
    this.conversationMessageMap.set(activeConv._id, updatedHistory);
    this.messages.set(updatedHistory);

    // Update last message in active conversation preview
    this.conversations.update(list => list.map(c => c._id === activeConv._id ? {
      ...c,
      last_message: { text, sender_name: myName }
    } : c));

    this.messageText.set('');
    this.replyToMessage.set(null);
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
    this.messages.update(list => list.map(m => m._id === msg._id ? { ...m, text: 'This message was deleted', is_deleted: true } : m));
    const activeConv = this.selectedConversation();
    if (activeConv) {
      const history = this.conversationMessageMap.get(activeConv._id) || [];
      this.conversationMessageMap.set(activeConv._id, history.map(m => m._id === msg._id ? { ...m, text: 'This message was deleted', is_deleted: true } : m));
    }
  }

  createDirectChat(): void {
    const target = this.targetDirectUserId().trim();
    if (!target) return;

    const newConv: ConversationItem = {
      _id: 'direct_' + Date.now(),
      type: 'direct',
      title: target,
      participants: [target, this.currentUserId()],
      last_message: { text: 'Conversation started', createdAt: new Date().toISOString() }
    };
    this.conversations.update(list => [newConv, ...list]);
    this.selectConversation(newConv);
    this.closeDirectModal();
  }

  openDirectModal(): void {
    this.directModalOpen.set(true);
    this.targetDirectUserId.set('');
  }

  closeDirectModal(): void {
    this.directModalOpen.set(false);
  }

  joinPublicGroup(grp: PublicGroupItem): void {
    this.publicGroups.update(list => list.map(g => g._id === grp._id ? { ...g, is_member: true } : g));
    this.addOrSelectGroupConv(grp);
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
    return '1-TO-1';
  }

  getTypeIcon(type: string): string {
    if (type === 'group_university') return '🏛️';
    if (type === 'group_country') return '🌐';
    if (type === 'group_batch') return '🎓';
    return '👤';
  }

  private seedDefaultHistoryMap(): void {
    this.conversationMessageMap.set('6a7890ec8559d01cd87f85b7', [
      {
        _id: 'm1',
        conversation_id: '6a7890ec8559d01cd87f85b7',
        sender_id: 'student_priya_202',
        sender_name: 'Priya Patel',
        text: 'hiii',
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ]);

    this.conversationMessageMap.set('6a7766e1a11062f0e0c6290b', [
      {
        _id: 'mb1',
        conversation_id: '6a7766e1a11062f0e0c6290b',
        sender_id: 'student_priya_202',
        sender_name: 'Priya Patel',
        text: 'hoho',
        createdAt: new Date(Date.now() - 5400000).toISOString()
      }
    ]);
  }
}
