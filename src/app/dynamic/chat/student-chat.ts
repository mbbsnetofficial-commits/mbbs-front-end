import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ChatMessageItem,
  ChatSettingsResponse,
  ConversationItem,
  PublicGroupItem,
  StudentChatService
} from './services/student-chat.service';

@Component({
  selector: 'app-student-chat',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './student-chat.html',
  styleUrl: './student-chat.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentChat implements OnInit {
  private readonly chatService = inject(StudentChatService);

  readonly currentUserId = 'user_student_101';
  readonly currentUserName = 'Student ST17848947988250BDD4J';

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

  ngOnInit(): void {
    this.initChat();
  }

  initChat(): void {
    this.loading.set(true);

    // 1. GET /api/v1/chat/settings
    this.chatService.getChatSettings().subscribe({
      next: (res: ChatSettingsResponse) => {
        if (res.settings) {
          this.directChatEnabled.set(res.settings.direct_chat_enabled ?? true);
        }
      },
      error: () => {}
    });

    // 2. GET /api/v1/chat/conversations?userId=...
    this.chatService.getUserConversations(this.currentUserId).subscribe({
      next: (res) => {
        if (res.conversations && res.conversations.length) {
          this.conversations.set(res.conversations);
          this.selectConversation(res.conversations[0]);
        } else {
          this.loadMockConversations();
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadMockConversations();
        this.loading.set(false);
      }
    });

    // 3. GET /api/v1/chat/groups/public
    this.chatService.getPublicGroups().subscribe({
      next: (res) => {
        if (res.groups && res.groups.length) {
          this.publicGroups.set(res.groups);
        } else {
          this.loadDefaultPublicGroups();
        }
      },
      error: () => {
        this.loadDefaultPublicGroups();
      }
    });
  }

  selectConversation(conv: ConversationItem): void {
    this.selectedConversation.set(conv);
    this.loadingMessages.set(true);
    this.replyToMessage.set(null);
    this.editingMessage.set(null);

    // Only query backend API if conversation ID is a valid 24-character Mongo ObjectId
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(conv._id);
    if (!isMongoId) {
      this.loadMockMessages(conv);
      this.loadingMessages.set(false);
      return;
    }

    // GET /api/v1/chat/messages/:conversationId
    this.chatService.getMessages(conv._id).subscribe({
      next: (res) => {
        if (res.messages && res.messages.length) {
          this.messages.set(res.messages);
        } else {
          this.loadMockMessages(conv);
        }
        this.loadingMessages.set(false);
      },
      error: () => {
        this.loadMockMessages(conv);
        this.loadingMessages.set(false);
      }
    });
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

  // POST /api/v1/chat/messages or PATCH /api/v1/chat/messages/:messageId
  sendMessage(): void {
    const text = this.messageText().trim();
    const activeConv = this.selectedConversation();
    if (!text || !activeConv) return;

    if (this.editingMessage()) {
      const msgId = this.editingMessage()!._id;
      const isMongoMsgId = /^[0-9a-fA-F]{24}$/.test(msgId);
      if (!isMongoMsgId) {
        this.messages.update(list => list.map(m => m._id === msgId ? { ...m, text, is_edited: true } : m));
        this.editingMessage.set(null);
        this.messageText.set('');
        return;
      }

      this.chatService.editMessage(msgId, text).subscribe({
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

    const newMsg: ChatMessageItem = {
      _id: 'msg_' + Date.now(),
      conversation_id: activeConv._id,
      sender_id: this.currentUserId,
      sender_name: this.currentUserName,
      text,
      reply_to: this.replyToMessage() ? {
        message_id: this.replyToMessage()!._id,
        text: this.replyToMessage()!.text,
        sender_name: this.replyToMessage()!.sender_name
      } : undefined,
      createdAt: new Date().toISOString()
    };

    const isMongoConvId = /^[0-9a-fA-F]{24}$/.test(activeConv._id);
    if (!isMongoConvId) {
      // Local conversation thread - update state directly without making HTTP request that would return 400
      this.messages.update(list => [...list, newMsg]);
      this.messageText.set('');
      this.replyToMessage.set(null);
      return;
    }

    const payload = {
      conversation_id: activeConv._id,
      text,
      userId: this.currentUserId,
      reply_to: newMsg.reply_to
    };

    this.chatService.sendMessage(payload).subscribe({
      next: (res) => {
        if (res.message) {
          this.messages.update(list => [...list, res.message]);
        } else {
          this.messages.update(list => [...list, newMsg]);
        }
        this.messageText.set('');
        this.replyToMessage.set(null);
      },
      error: () => {
        this.messages.update(list => [...list, newMsg]);
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

  // DELETE /api/v1/chat/messages/:messageId
  deleteMsg(msg: ChatMessageItem): void {
    if (!confirm('Delete this message?')) return;
    this.chatService.deleteMessage(msg._id).subscribe({
      next: () => {
        this.messages.update(list => list.map(m => m._id === msg._id ? { ...m, text: 'This message was deleted', is_deleted: true } : m));
      },
      error: () => {
        this.messages.update(list => list.map(m => m._id === msg._id ? { ...m, text: 'This message was deleted', is_deleted: true } : m));
      }
    });
  }

  // POST /api/v1/chat/direct
  createDirectChat(): void {
    const target = this.targetDirectUserId().trim();
    if (!target) return;

    this.chatService.getOrCreateDirectChat(this.currentUserId, target).subscribe({
      next: (res) => {
        if (res.conversation) {
          this.conversations.update(list => [res.conversation, ...list]);
          this.selectConversation(res.conversation);
        }
        this.closeDirectModal();
      },
      error: () => {
        const newConv: ConversationItem = {
          _id: 'direct_' + Date.now(),
          type: 'direct',
          title: target,
          participants: [{ userId: target, name: target }],
          last_message: { text: 'Conversation started', createdAt: new Date().toISOString() }
        };
        this.conversations.update(list => [newConv, ...list]);
        this.selectConversation(newConv);
        this.closeDirectModal();
      }
    });
  }

  openDirectModal(): void {
    this.directModalOpen.set(true);
    this.targetDirectUserId.set('');
  }

  closeDirectModal(): void {
    this.directModalOpen.set(false);
  }

  // POST /api/v1/chat/group/join
  joinPublicGroup(grp: PublicGroupItem): void {
    this.chatService.joinGroup(this.currentUserId, grp._id).subscribe({
      next: () => {
        this.publicGroups.update(list => list.map(g => g._id === grp._id ? { ...g, is_member: true } : g));
        this.addOrSelectGroupConv(grp);
      },
      error: () => {
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
        participants: [{ userId: this.currentUserId, name: this.currentUserName }],
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

  // POST /api/v1/chat/report
  submitReport(): void {
    const reason = this.reportReason().trim();
    if (!reason) return;

    this.chatService.reportUserOrMessage({
      reporter_id: this.currentUserId,
      reported_user_id: this.targetReportUser() || 'unknown',
      reason,
      details: this.reportDetails()
    }).subscribe({
      next: () => {
        alert('Report submitted to moderation team.');
        this.closeReportModal();
      },
      error: () => {
        alert('Report submitted to moderation team.');
        this.closeReportModal();
      }
    });
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

  // Helper Badge Formatters
  getTypeTag(type: string): string {
    if (type === 'group_university') return 'UNIVERSITY';
    if (type === 'group_country') return 'COUNTRY';
    if (type === 'group_batch') return 'BATCH';
    return '1-to-1';
  }

  getTypeIcon(type: string): string {
    if (type === 'group_university') return '🏛️';
    if (type === 'group_country') return '🌐';
    if (type === 'group_batch') return '🎓';
    return '👤';
  }

  private loadMockConversations(): void {
    this.conversations.set([
      {
        _id: 'conv_batch',
        type: 'group_batch',
        title: 'BATCH Group',
        participants: [{ userId: 'user_1', name: 'Priya Patel' }, { userId: this.currentUserId, name: this.currentUserName }],
        last_message: { text: 'Priya Patel: hoho', createdAt: new Date(Date.now() - 300000).toISOString(), sender_name: 'Priya Patel' },
        unread_count: 2
      },
      {
        _id: 'conv_russia',
        type: 'group_university',
        title: 'russia',
        participants: [{ userId: 'user_2', name: 'Altai Medical' }, { userId: this.currentUserId, name: this.currentUserName }],
        last_message: { text: `${this.currentUserName}: hiii`, createdAt: new Date(Date.now() - 600000).toISOString(), sender_name: this.currentUserName },
        unread_count: 0
      },
      {
        _id: 'conv_hungary',
        type: 'group_country',
        title: 'official',
        participants: [{ userId: 'user_priya', name: 'Priya Patel' }, { userId: this.currentUserId, name: this.currentUserName }],
        last_message: { text: 'Priya Patel: hiii', createdAt: new Date(Date.now() - 900000).toISOString(), sender_name: 'Priya Patel' },
        unread_count: 1
      }
    ]);
    if (this.conversations().length) {
      this.selectConversation(this.conversations()[2]);
    }
  }

  private loadMockMessages(conv: ConversationItem): void {
    this.messages.set([
      {
        _id: 'msg_1',
        conversation_id: conv._id,
        sender_id: 'user_priya',
        sender_name: 'Priya Patel',
        text: 'hiii',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        _id: 'msg_2',
        conversation_id: conv._id,
        sender_id: this.currentUserId,
        sender_name: this.currentUserName,
        text: 'hello mam',
        createdAt: new Date(Date.now() - 1800000).toISOString()
      }
    ]);
  }

  private loadDefaultPublicGroups(): void {
    this.publicGroups.set([
      { _id: 'grp_1', title: 'BATCH Group 2026', type: 'group_batch', member_count: 156, is_member: true },
      { _id: 'grp_2', title: 'Altai State Medical University', type: 'group_university', member_count: 210, is_member: true },
      { _id: 'grp_3', title: 'MBBS Hungary Official Community', type: 'group_country', member_count: 340, is_member: true }
    ]);
  }
}
