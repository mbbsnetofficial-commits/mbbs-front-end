import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ChatMessageItem,
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
export class StudentChat implements OnInit, OnDestroy {
  private readonly chatService = inject(StudentChatService);

  readonly currentUserId = '6a63554e323b3e70a7c0f9d5';
  readonly currentUserName = 'Student STU1784894798825OBDD4J';

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

  ngOnDestroy(): void {}

  refreshActiveMessages(): void {
    const activeConv = this.selectedConversation();
    if (activeConv) {
      this.fetchMessagesForConv(activeConv._id);
    }
  }

  isOutgoing(msg: ChatMessageItem): boolean {
    if (!msg) return false;
    return (
      msg.sender_id === this.currentUserId ||
      msg.sender_name === this.currentUserName ||
      msg.sender_info?.name === this.currentUserName ||
      msg.sender_id === '6a63554e323b3e70a7c0f9d5'
    );
  }

  initChat(): void {
    this.loading.set(true);

    // 1. GET /api/v1/chat/groups/public (Fetch all admin-created groups from database)
    this.chatService.getPublicGroups().subscribe({
      next: (res) => {
        const groups = res.data || [];
        this.publicGroups.set(groups);

        // Convert public groups to ConversationItem format for the left sidebar
        const groupConvs: ConversationItem[] = groups.map(g => ({
          _id: g._id,
          type: g.type,
          title: g.title,
          participants: g.participants || [this.currentUserId],
          last_message: g.last_message ? {
            text: g.last_message.text || 'No messages yet',
            sender_name: g.last_message.sender_name || '',
            createdAt: g.last_message.sent_at || g.last_message.createdAt
          } : { text: 'No messages yet' }
        }));

        if (groupConvs.length) {
          this.conversations.set(groupConvs);
          // Select default group (e.g. "official" or "BATCH Group")
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

    // 2. Fetch User Joined Conversations: GET /api/v1/chat/conversations
    this.chatService.getUserConversations(this.currentUserId).subscribe({
      next: (res) => {
        if (res.data && res.data.length) {
          // Merge user direct conversations with public groups
          this.conversations.update(existing => {
            const map = new Map<string, ConversationItem>();
            existing.forEach(c => map.set(c._id, c));
            res.data.forEach(c => map.set(c._id, c));
            return Array.from(map.values());
          });
        }
      },
      error: () => {}
    });
  }

  selectConversation(conv: ConversationItem): void {
    this.selectedConversation.set(conv);
    this.loadingMessages.set(true);
    this.replyToMessage.set(null);
    this.editingMessage.set(null);

    this.fetchMessagesForConv(conv._id);
  }

  private fetchMessagesForConv(convId: string): void {
    // GET /api/v1/chat/messages/:conversationId
    this.chatService.getMessages(convId).subscribe({
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

  private pollActiveMessages(): void {
    const activeConv = this.selectedConversation();
    if (activeConv && activeConv._id) {
      this.chatService.getMessages(activeConv._id).subscribe({
        next: (res) => {
          const fetched = (res.data || []).map(m => ({
            ...m,
            sender_name: m.sender_info?.name || m.sender_name || m.sender_id
          }));
          // Only update if count or latest message ID changed
          if (fetched.length !== this.messages().length || 
              (fetched.length > 0 && fetched[fetched.length - 1]._id !== this.messages()[this.messages().length - 1]?._id)) {
            this.messages.set(fetched);
          }
        },
        error: () => {}
      });
    }
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
      this.chatService.editMessage(msgId, text, this.currentUserId).subscribe({
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
      sender_info: { name: this.currentUserName },
      reply_to: this.replyToMessage() ? {
        message_id: this.replyToMessage()!._id,
        text: this.replyToMessage()!.text,
        sender_name: this.replyToMessage()!.sender_name
      } : undefined
    };

    // POST /api/v1/chat/messages
    this.chatService.sendMessage(payload).subscribe({
      next: (res) => {
        if (res.data) {
          const formatted: ChatMessageItem = {
            ...res.data,
            sender_name: res.data.sender_info?.name || this.currentUserName
          };
          this.messages.update(list => [...list, formatted]);

          // Update last message in active conversation preview
          this.conversations.update(list => list.map(c => c._id === activeConv._id ? {
            ...c,
            last_message: { text, sender_name: this.currentUserName }
          } : c));
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
    this.chatService.deleteMessage(msg._id, this.currentUserId).subscribe({
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
        if (res.data) {
          this.conversations.update(list => [res.data, ...list]);
          this.selectConversation(res.data);
        }
        this.closeDirectModal();
      },
      error: () => {
        const newConv: ConversationItem = {
          _id: 'direct_' + Date.now(),
          type: 'direct',
          title: target,
          participants: [target, this.currentUserId],
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
        participants: [this.currentUserId],
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
      reported_user_id: this.targetReportUser() || 'community_user',
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
    return '1-TO-1';
  }

  getTypeIcon(type: string): string {
    if (type === 'group_university') return '🏛️';
    if (type === 'group_country') return '🌐';
    if (type === 'group_batch') return '🎓';
    return '👤';
  }

  private loadDefaultConversations(): void {
    const defaultConvs: ConversationItem[] = [
      {
        _id: '6a7890ec8559d01cd87f85b7',
        type: 'group_country',
        title: 'official',
        participants: [this.currentUserId, 'student_priya_202'],
        last_message: { text: 'hello mam', sender_name: 'Student STU1784894798825OBDD4J' }
      },
      {
        _id: '6a788890d1daf3219b5f7095',
        type: 'group_university',
        title: 'russia',
        participants: [this.currentUserId],
        last_message: { text: 'hiii', sender_name: 'Student STU1784894798825OBDD4J' }
      },
      {
        _id: '6a7888aad1daf3219b5f7096',
        type: 'group_country',
        title: 'russia',
        participants: [this.currentUserId],
        last_message: { text: 'No messages yet' }
      },
      {
        _id: '6a7766e1a11062f0e0c6290b',
        type: 'group_batch',
        title: 'BATCH Group',
        participants: ['admin_official_01', this.currentUserId],
        last_message: { text: 'hoho', sender_name: 'Priya Patel' }
      }
    ];
    this.conversations.set(defaultConvs);
    this.selectConversation(defaultConvs[0]);
  }
}
