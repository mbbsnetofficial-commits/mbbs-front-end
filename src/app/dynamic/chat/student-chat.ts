import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { TokenService } from '../../core/serivce/token.service';
import {
  ChatMessageItem,
  CommunityConversationType,
  ConversationItem,
  PublicGroupItem,
  StudentChatService
} from './services/student-chat.service';
import { StudentSocketService } from './services/student-socket.service';

type ChatFilter = 'all' | 'university' | 'country' | 'batch';

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
  @ViewChild('messagesBoard') private messagesBoard?: ElementRef<HTMLDivElement>;

  readonly currentUserId = signal('');
  readonly currentUserName = signal('');

  readonly loading = signal(true);
  readonly loadingMessages = signal(false);
  readonly sending = signal(false);
  readonly joiningGroupId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly activeFilter = signal<ChatFilter>('all');
  readonly searchQuery = signal('');
  readonly groupSearchQuery = signal('');

  readonly conversations = signal<ConversationItem[]>([]);
  readonly publicGroups = signal<PublicGroupItem[]>([]);
  readonly selectedConversation = signal<ConversationItem | null>(null);
  readonly messages = signal<ChatMessageItem[]>([]);
  readonly joinedGroupIds = signal<Set<string>>(new Set());

  readonly messageText = signal('');
  readonly replyToMessage = signal<ChatMessageItem | null>(null);
  readonly editingMessage = signal<ChatMessageItem | null>(null);

  readonly groupModalOpen = signal(false);
  readonly reportModalOpen = signal(false);
  readonly reportReason = signal('');
  readonly reportDetails = signal('');
  readonly targetReportUser = signal<string | null>(null);
  readonly targetReportMessageId = signal<string | null>(null);

  readonly quickEmojis = ['👍', '🔥', '🎓', '📚', '💡', '🙏', '✅', '🙌'];

  readonly filteredConversations = computed(() => {
    const filter = this.activeFilter();
    const query = this.searchQuery().trim().toLowerCase();

    return this.conversations().filter((conversation) => {
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'university'
            ? conversation.type === 'group_university'
            : filter === 'country'
              ? conversation.type === 'group_country'
              : conversation.type === 'group_batch';

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        (conversation.title || '').toLowerCase().includes(query) ||
        (conversation.last_message?.text || '').toLowerCase().includes(query)
      );
    });
  });

  readonly filteredPublicGroups = computed(() => {
    const query = this.groupSearchQuery().trim().toLowerCase();
    if (!query) {
      return this.publicGroups();
    }

    return this.publicGroups().filter((group) => {
      return (
        group.title.toLowerCase().includes(query) ||
        this.getTypeLabel(group.type).toLowerCase().includes(query)
      );
    });
  });

  readonly selectedConversationMembers = computed(() => {
    return this.selectedConversation()?.participants.length || 0;
  });

  readonly emptyStateTitle = computed(() => {
    if (this.searchQuery().trim()) {
      return 'No community groups match your search';
    }
    if (this.activeFilter() !== 'all') {
      return 'No groups in this category yet';
    }
    return 'No community groups available yet';
  });

  private socketSub: Subscription | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private readonly joinedGroupsStorageKeyPrefix = 'mbbs_joined_groups';
  private readonly scrollThreshold = 96;

  ngOnInit(): void {
    this.initStudentIdentity();
    this.loadCommunityGroups();
    this.socketService.connect(this.currentUserId());

    this.socketSub = this.socketService.onMessage$.subscribe((message) => {
      const activeConversation = this.selectedConversation();
      if (
        activeConversation &&
        String(message.conversation_id) === String(activeConversation._id)
      ) {
        const shouldStickToBottom = this.isNearBottom();
        this.messages.update((items) => {
          if (items.some((item) => item._id === message._id)) {
            return items;
          }
          const nextItems = [...items, this.normalizeMessage(message)];
          this.queueScrollToBottom(shouldStickToBottom, true);
          return nextItems;
        });
      }
    });

    this.pollInterval = setInterval(() => {
      const activeConversation = this.selectedConversation();
      if (activeConversation && !this.loadingMessages()) {
        this.fetchMessages(activeConversation, false);
      }
    }, 5000);
  }

  ngOnDestroy(): void {
    this.socketSub?.unsubscribe();
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    this.socketService.disconnect();
  }

  private initStudentIdentity(): void {
    const studentId = this.tokenService.getStudentId()?.trim();
    const displayName = this.tokenService.getUserDisplayName()?.trim();

    if (studentId) {
      this.currentUserId.set(studentId);
      this.currentUserName.set(displayName || `Student_${studentId.slice(0, 6)}`);
      return;
    }

    let fallbackId = sessionStorage.getItem('mbbs_chat_user_id');
    let fallbackName = sessionStorage.getItem('mbbs_chat_user_name');

    if (!fallbackId) {
      const randomKey = Math.random().toString(16).slice(2, 8);
      fallbackId = `student_${randomKey}`;
      fallbackName = `Student ${randomKey.toUpperCase()}`;
      sessionStorage.setItem('mbbs_chat_user_id', fallbackId);
      sessionStorage.setItem('mbbs_chat_user_name', fallbackName);
    }

    this.currentUserId.set(fallbackId);
    this.currentUserName.set(fallbackName || fallbackId);
  }

  loadCommunityGroups(): void {
    this.loading.set(true);
    this.error.set(null);

    this.chatService.getPublicGroups().subscribe({
      next: (response) => {
        const groups = response.data || [];
        const persistedJoinedGroups = this.getPersistedJoinedGroups();
        this.publicGroups.set(groups);
        this.joinedGroupIds.set(
          new Set([
            ...persistedJoinedGroups,
            ...groups.filter((group) => group.is_member).map((group) => group._id)
          ])
        );

        const conversations = groups.map((group) => this.groupToConversation(group));
        this.conversations.set(conversations);

        const firstConversation =
          conversations.find((conversation) => this.isMember(conversation._id)) ||
          conversations[0] ||
          null;

        if (firstConversation) {
          this.selectConversation(firstConversation);
        }

        this.loading.set(false);
      },
      error: () => {
        this.error.set(
          'We could not load the community groups right now. Please refresh and try again.'
        );
        this.loading.set(false);
      }
    });
  }

  selectConversation(conversation: ConversationItem): void {
    this.selectedConversation.set(conversation);
    this.replyToMessage.set(null);
    this.editingMessage.set(null);
    this.successMessage.set(null);
    this.socketService.joinConversation(conversation._id);
    this.fetchMessages(conversation, true);
  }

  refreshActiveMessages(): void {
    const conversation = this.selectedConversation();
    if (conversation) {
      this.fetchMessages(conversation, true);
    }
  }

  fetchMessages(conversation: ConversationItem, showLoader: boolean): void {
    const shouldStickToBottom = showLoader || this.isNearBottom();
    if (showLoader) {
      this.loadingMessages.set(true);
    }

    this.chatService
      .getMessages(conversation._id, this.currentUserId(), 1, 100)
      .subscribe({
        next: (response) => {
          this.messages.set(
            (response.data || []).map((message) => this.normalizeMessage(message))
          );
          this.loadingMessages.set(false);
          this.queueScrollToBottom(shouldStickToBottom, !showLoader);
        },
        error: () => {
          this.loadingMessages.set(false);
        }
      });
  }

  isMember(conversationId?: string): boolean {
    return conversationId ? this.joinedGroupIds().has(conversationId) : false;
  }

  joinSelectedConversation(): void {
    const conversation = this.selectedConversation();
    if (conversation) {
      this.joinGroupById(conversation._id);
    }
  }

  joinPublicGroup(group: PublicGroupItem): void {
    this.joinGroupById(group._id);
  }

  private joinGroupById(conversationId: string): void {
    if (this.joiningGroupId() === conversationId) {
      return;
    }

    this.joiningGroupId.set(conversationId);
    this.chatService.joinGroup(this.currentUserId(), conversationId).subscribe({
      next: () => {
        this.applyJoinState(conversationId);
      },
      error: () => {
        this.applyJoinState(conversationId);
      }
    });
  }

  private applyJoinState(conversationId: string): void {
    this.joinedGroupIds.update((set) => new Set(set).add(conversationId));
    this.persistJoinedGroups();
    this.publicGroups.update((groups) =>
      groups.map((group) =>
        group._id === conversationId ? { ...group, is_member: true } : group
      )
    );
    this.successMessage.set('You have joined the group and can start messaging now.');
    this.joiningGroupId.set(null);

    const conversation = this.conversations().find((item) => item._id === conversationId);
    if (conversation) {
      this.selectConversation(conversation);
    }
  }

  addEmoji(emoji: string): void {
    this.messageText.update((value) => `${value}${emoji}`);
  }

  startReply(message: ChatMessageItem): void {
    this.replyToMessage.set(message);
    this.editingMessage.set(null);
  }

  cancelReply(): void {
    this.replyToMessage.set(null);
  }

  startEdit(message: ChatMessageItem): void {
    this.editingMessage.set(message);
    this.replyToMessage.set(null);
    this.messageText.set(message.text);
  }

  cancelEdit(): void {
    this.editingMessage.set(null);
    this.messageText.set('');
  }

  sendMessage(): void {
    const conversation = this.selectedConversation();
    const text = this.messageText().trim();

    if (!conversation || !text || this.sending()) {
      return;
    }

    if (!this.isMember(conversation._id)) {
      this.error.set('Join this community group first before sending a message.');
      return;
    }

    this.sending.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    if (this.editingMessage()) {
      const editing = this.editingMessage()!;
      this.chatService
        .editMessage(editing._id, text, this.currentUserId())
        .subscribe({
          next: () => {
            this.messages.update((messages) =>
              messages.map((message) =>
                message._id === editing._id
                  ? { ...message, text, is_edited: true }
                  : message
              )
            );
            this.messageText.set('');
            this.editingMessage.set(null);
            this.sending.set(false);
            this.queueScrollToBottom(true, true);
          },
          error: () => {
            this.error.set('We could not update the message right now.');
            this.sending.set(false);
          }
        });
      return;
    }

    const payload = {
      conversation_id: conversation._id,
      text,
      userId: this.currentUserId(),
      sender_info: {
        name: this.currentUserName()
      },
      reply_to: this.replyToMessage()
        ? {
            message_id: this.replyToMessage()!._id,
            text: this.replyToMessage()!.text,
            sender_name: this.replyToMessage()!.sender_name
          }
        : undefined
    };

    this.socketService.sendMessage(payload);

    this.chatService.sendMessage(payload).subscribe({
      next: (response) => {
        const message = response.data
          ? this.normalizeMessage(response.data)
          : this.createLocalMessage(text);

        this.messages.update((messages) => [...messages, message]);
        this.updateConversationPreview(conversation._id, text);
        this.messageText.set('');
        this.replyToMessage.set(null);
        this.sending.set(false);
        this.queueScrollToBottom(true, true);
      },
      error: () => {
        const fallbackMessage = this.createLocalMessage(text);
        this.messages.update((messages) => [...messages, fallbackMessage]);
        this.updateConversationPreview(conversation._id, text);
        this.messageText.set('');
        this.replyToMessage.set(null);
        this.sending.set(false);
        this.queueScrollToBottom(true, true);
      }
    });
  }

  deleteMessage(message: ChatMessageItem): void {
    if (!confirm('Delete this message from the group thread?')) {
      return;
    }

    this.chatService.deleteMessage(message._id, this.currentUserId()).subscribe({
      next: () => {
        this.markMessageDeleted(message._id);
      },
      error: () => {
        this.markMessageDeleted(message._id);
      }
    });
  }

  private markMessageDeleted(messageId: string): void {
    this.messages.update((messages) =>
      messages.map((message) =>
        message._id === messageId
          ? {
              ...message,
              text: 'This message was deleted',
              is_deleted: true
            }
          : message
      )
    );
  }

  isOutgoing(message: ChatMessageItem): boolean {
    return String(message.sender_id || '').trim() === this.currentUserId().trim();
  }

  openGroupModal(): void {
    this.groupModalOpen.set(true);
  }

  closeGroupModal(): void {
    this.groupModalOpen.set(false);
    this.groupSearchQuery.set('');
  }

  openReportModal(message?: ChatMessageItem): void {
    this.targetReportUser.set(message?.sender_id || null);
    this.targetReportMessageId.set(message?._id || null);
    this.reportModalOpen.set(true);
  }

  closeReportModal(): void {
    this.reportModalOpen.set(false);
    this.reportReason.set('');
    this.reportDetails.set('');
    this.targetReportUser.set(null);
    this.targetReportMessageId.set(null);
  }

  submitReport(): void {
    const reason = this.reportReason().trim();
    if (!reason) {
      return;
    }

    this.chatService
      .reportUserOrMessage({
        reporter_id: this.currentUserId(),
        reported_user_id: this.targetReportUser() || undefined,
        message_id: this.targetReportMessageId() || undefined,
        reason,
        details: this.reportDetails().trim() || undefined
      })
      .subscribe({
        next: () => {
          this.successMessage.set('Your report has been submitted to the moderation team.');
          this.closeReportModal();
        },
        error: () => {
          this.successMessage.set('Your report has been submitted to the moderation team.');
          this.closeReportModal();
        }
      });
  }

  getTypeLabel(type: CommunityConversationType): string {
    if (type === 'group_university') {
      return 'University Group';
    }
    if (type === 'group_country') {
      return 'Country Group';
    }
    return 'Batch Group';
  }

  getTypeTag(type: CommunityConversationType): string {
    if (type === 'group_university') {
      return 'UNIVERSITY';
    }
    if (type === 'group_country') {
      return 'COUNTRY';
    }
    return 'BATCH';
  }

  getTypeIcon(type: CommunityConversationType): string {
    if (type === 'group_university') {
      return '🏛';
    }
    if (type === 'group_country') {
      return '🌍';
    }
    return '🎓';
  }

  private groupToConversation(group: PublicGroupItem): ConversationItem {
    return {
      _id: group._id,
      type: group.type,
      title: group.title,
      participants: group.participants || [],
      unread_count: 0,
      last_message: group.last_message
        ? {
            text: String(group.last_message.text || 'No messages yet'),
            sender_name: group.last_message.sender_name,
            sent_at: group.last_message.sent_at,
            createdAt: group.last_message.createdAt
          }
        : { text: 'No messages yet' }
    };
  }

  private normalizeMessage(message: ChatMessageItem): ChatMessageItem {
    return {
      ...message,
      sender_name:
        message.sender_info?.name || message.sender_name || message.sender_id
    };
  }

  private createLocalMessage(text: string): ChatMessageItem {
    return {
      _id: `msg_${Date.now()}`,
      conversation_id: this.selectedConversation()?._id || '',
      sender_id: this.currentUserId(),
      sender_name: this.currentUserName(),
      text,
      reply_to: this.replyToMessage()
        ? {
            message_id: this.replyToMessage()!._id,
            text: this.replyToMessage()!.text,
            sender_name: this.replyToMessage()!.sender_name
          }
        : undefined,
      createdAt: new Date().toISOString()
    };
  }

  private updateConversationPreview(conversationId: string, text: string): void {
    this.conversations.update((conversations) =>
      conversations.map((conversation) =>
        conversation._id === conversationId
          ? {
              ...conversation,
              last_message: {
                text,
                sender_name: this.currentUserName(),
                createdAt: new Date().toISOString()
              }
            }
          : conversation
      )
    );
  }

  private get joinedGroupsStorageKey(): string {
    return `${this.joinedGroupsStorageKeyPrefix}:${this.currentUserId()}`;
  }

  private getPersistedJoinedGroups(): string[] {
    try {
      const raw = localStorage.getItem(this.joinedGroupsStorageKey);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }

  private persistJoinedGroups(): void {
    localStorage.setItem(
      this.joinedGroupsStorageKey,
      JSON.stringify(Array.from(this.joinedGroupIds()))
    );
  }

  private isNearBottom(): boolean {
    const board = this.messagesBoard?.nativeElement;
    if (!board) {
      return true;
    }

    const distanceFromBottom =
      board.scrollHeight - board.clientHeight - board.scrollTop;

    return distanceFromBottom <= this.scrollThreshold;
  }

  private queueScrollToBottom(force = false, smooth = false): void {
    setTimeout(() => {
      const board = this.messagesBoard?.nativeElement;
      if (board && force) {
        board.scrollTo({
          top: board.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto'
        });
      }
    }, 0);
  }
}
