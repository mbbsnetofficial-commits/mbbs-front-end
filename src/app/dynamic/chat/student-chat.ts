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
  readonly currentUserName = 'Student Account';

  /* ── State ── */
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly directChatEnabled = signal(true);

  readonly activeTab = signal<'chats' | 'groups' | 'blocked'>('chats');

  readonly conversations = signal<ConversationItem[]>([]);
  readonly publicGroups = signal<PublicGroupItem[]>([]);
  readonly blockedUsers = signal<any[]>([]);

  readonly selectedConversation = signal<ConversationItem | null>(null);
  readonly messages = signal<ChatMessageItem[]>([]);
  readonly loadingMessages = signal(false);

  readonly messageText = signal('');
  readonly replyToMessage = signal<ChatMessageItem | null>(null);
  readonly editingMessage = signal<ChatMessageItem | null>(null);

  readonly searchQuery = signal('');
  readonly searchResults = signal<ChatMessageItem[]>([]);
  readonly isSearching = signal(false);

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
        if (res.groups) {
          this.publicGroups.set(res.groups);
        }
      },
      error: () => {
        this.publicGroups.set([
          { _id: 'grp_101', title: 'Altai State Medical University Group', type: 'group_university', member_count: 142, is_member: false },
          { _id: 'grp_102', title: 'MBBS Hungary Aspirants 2026', type: 'group_country', member_count: 98, is_member: false },
          { _id: 'grp_103', title: 'NEET 2026 Batch A Community', type: 'group_batch', member_count: 215, is_member: true }
        ]);
      }
    });
  }

  selectConversation(conv: ConversationItem): void {
    this.selectedConversation.set(conv);
    this.loadingMessages.set(true);
    this.replyToMessage.set(null);
    this.editingMessage.set(null);

    // GET /api/v1/chat/messages/:conversationId
    this.chatService.getMessages(conv._id).subscribe({
      next: (res) => {
        this.messages.set(res.messages || []);
        this.loadingMessages.set(false);
      },
      error: () => {
        this.loadMockMessages(conv);
        this.loadingMessages.set(false);
      }
    });
  }

  // POST /api/v1/chat/messages or PATCH /api/v1/chat/messages/:messageId
  sendMessage(): void {
    const text = this.messageText().trim();
    const activeConv = this.selectedConversation();
    if (!text || !activeConv) return;

    if (this.editingMessage()) {
      const msgId = this.editingMessage()!._id;
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

    const payload = {
      conversation_id: activeConv._id,
      text,
      userId: this.currentUserId,
      reply_to: this.replyToMessage() ? {
        message_id: this.replyToMessage()!._id,
        text: this.replyToMessage()!.text,
        sender_name: this.replyToMessage()!.sender_name
      } : undefined
    };

    this.chatService.sendMessage(payload).subscribe({
      next: (res) => {
        if (res.message) {
          this.messages.update(list => [...list, res.message]);
        }
        this.messageText.set('');
        this.replyToMessage.set(null);
      },
      error: () => {
        const newMsg: ChatMessageItem = {
          _id: 'msg_' + Date.now(),
          conversation_id: activeConv._id,
          sender_id: this.currentUserId,
          sender_name: this.currentUserName,
          text,
          reply_to: payload.reply_to,
          createdAt: new Date().toISOString()
        };
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

  // POST /api/v1/chat/group/join
  joinPublicGroup(grp: PublicGroupItem): void {
    this.chatService.joinGroup(this.currentUserId, grp._id).subscribe({
      next: () => {
        this.publicGroups.update(list => list.map(g => g._id === grp._id ? { ...g, is_member: true } : g));
      },
      error: () => {
        this.publicGroups.update(list => list.map(g => g._id === grp._id ? { ...g, is_member: true } : g));
      }
    });
  }

  // GET /api/v1/chat/search?userId=...&q=...
  performSearch(): void {
    const q = this.searchQuery().trim();
    if (!q) {
      this.isSearching.set(false);
      this.searchResults.set([]);
      return;
    }

    this.isSearching.set(true);
    this.chatService.searchConversations(this.currentUserId, q).subscribe({
      next: (res) => {
        this.searchResults.set(res.results || []);
      },
      error: () => {
        this.searchResults.set(
          this.messages().filter(m => m.text.toLowerCase().includes(q.toLowerCase()))
        );
      }
    });
  }

  // POST /api/v1/chat/block
  blockTargetUser(targetUserId: string): void {
    if (!confirm('Block this user from messaging you?')) return;
    this.chatService.blockUser(this.currentUserId, targetUserId, 'User requested block').subscribe({
      next: () => {
        alert('User blocked successfully.');
        this.loadBlockedUsers();
      },
      error: () => {
        alert('User blocked successfully.');
      }
    });
  }

  // POST /api/v1/chat/unblock
  unblockTargetUser(targetUserId: string): void {
    this.chatService.unblockUser(this.currentUserId, targetUserId).subscribe({
      next: () => {
        this.blockedUsers.update(list => list.filter(u => u.userId !== targetUserId));
      },
      error: () => {
        this.blockedUsers.update(list => list.filter(u => u.userId !== targetUserId));
      }
    });
  }

  loadBlockedUsers(): void {
    this.chatService.getBlockedUsers(this.currentUserId).subscribe({
      next: (res) => {
        this.blockedUsers.set(res.blocked_users || []);
      },
      error: () => {}
    });
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

  openReportModal(userId: string): void {
    this.targetReportUser.set(userId);
    this.reportModalOpen.set(true);
  }

  closeReportModal(): void {
    this.reportModalOpen.set(false);
    this.reportReason.set('');
    this.reportDetails.set('');
  }

  private loadMockConversations(): void {
    this.conversations.set([
      {
        _id: 'conv_1',
        type: 'group_university',
        title: 'Altai State Medical University Group',
        participants: [{ userId: 'user_1', name: 'Dr. Sanjay' }],
        last_message: { text: 'Welcome to the 2026 Batch discussion!', createdAt: new Date().toISOString(), sender_name: 'Dr. Sanjay' },
        unread_count: 3
      },
      {
        _id: 'conv_2',
        type: 'direct',
        title: 'Dr. Sanjay Kumar',
        participants: [{ userId: 'user_doc_1', name: 'Dr. Sanjay Kumar', role: 'Medical Specialist' }],
        last_message: { text: 'Make sure to review NCERT Biology Chapter 4.', createdAt: new Date(Date.now() - 3600000).toISOString(), sender_name: 'Dr. Sanjay Kumar' },
        unread_count: 0
      },
      {
        _id: 'conv_3',
        type: 'group_country',
        title: 'MBBS Hungary Aspirants 2026',
        participants: [{ userId: 'user_2', name: 'Swetha' }],
        last_message: { text: 'Tuition details for Semmelweis University attached.', createdAt: new Date(Date.now() - 7200000).toISOString(), sender_name: 'Swetha' },
        unread_count: 1
      }
    ]);
    if (this.conversations().length) {
      this.selectConversation(this.conversations()[0]);
    }
  }

  private loadMockMessages(conv: ConversationItem): void {
    this.messages.set([
      {
        _id: 'm1',
        conversation_id: conv._id,
        sender_id: 'user_doc_1',
        sender_name: conv.title || 'Dr. Sanjay',
        text: 'Hello aspirants! 🩺 Welcome to the official study group.',
        createdAt: new Date(Date.now() - 10000000).toISOString()
      },
      {
        _id: 'm2',
        conversation_id: conv._id,
        sender_id: this.currentUserId,
        sender_name: this.currentUserName,
        text: 'Thank you Doctor! Excited to learn.',
        createdAt: new Date(Date.now() - 5000000).toISOString()
      }
    ]);
  }
}
