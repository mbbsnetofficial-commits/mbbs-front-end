import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UcatChatMessage, UcatChatSession } from '../../models/ucat-chat.model';
import { UcatChatService } from '../../services/ucat-chat.service';

@Component({
  selector: 'app-ucat-ai-chat-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ucat-ai-chat-modal.html',
  styleUrl: './ucat-ai-chat-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UcatAiChatModal implements OnInit, OnChanges {
  @Input({ required: true }) chatSessionId!: string;
  @Input() testSessionId = '';
  @Input() testTitle = 'UCAT Test Review';

  @Output() closeModal = new EventEmitter<void>();

  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;

  readonly sessionMetadata = signal<UcatChatSession | null>(null);
  readonly messages = signal<UcatChatMessage[]>([]);
  readonly inputContent = signal<string>('');

  readonly isLoadingMessages = signal<boolean>(false);
  readonly isSending = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly suggestedPrompts = [
    'Why was the correct option chosen for question 1?',
    'Give me feedback on my time management during this test.',
    'Explain the key logical rules behind my wrong answers.',
    'Summarize my main strengths and areas for improvement.'
  ];

  constructor(private readonly ucatChatService: UcatChatService) {}

  ngOnInit(): void {
    if (this.chatSessionId) {
      this.initChatSession();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chatSessionId'] && !changes['chatSessionId'].firstChange && this.chatSessionId) {
      this.initChatSession();
    }
  }

  private initChatSession(): void {
    this.errorMessage.set(null);
    this.loadSessionMetadata();
    this.loadMessages();
  }

  private loadSessionMetadata(): void {
    this.ucatChatService.getChatSession(this.chatSessionId).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.sessionMetadata.set(res.data);
        }
      },
      error: () => {
        // Fallback to defaults
      }
    });
  }

  loadMessages(): void {
    this.isLoadingMessages.set(true);
    this.errorMessage.set(null);

    this.ucatChatService.getMessages(this.chatSessionId).subscribe({
      next: (res) => {
        this.isLoadingMessages.set(false);
        if (res && Array.isArray(res.data)) {
          this.messages.set(res.data);
          this.scrollToBottom();
        }
      },
      error: (err) => {
        this.isLoadingMessages.set(false);
        const msg = err?.error?.message || err?.message || 'Failed to load conversation history.';
        this.errorMessage.set(msg);
      }
    });
  }

  onSendMessage(customContent?: string): void {
    const contentToSend = (customContent || this.inputContent()).trim();
    if (!contentToSend || this.isSending()) return;

    this.isSending.set(true);
    this.errorMessage.set(null);
    this.inputContent.set('');

    this.ucatChatService.sendMessage(this.chatSessionId, contentToSend).subscribe({
      next: (res) => {
        this.isSending.set(false);
        if (res && res.data) {
          const { userMessage, aiMessage } = res.data;
          const current = this.messages();
          const newMessages = [...current];

          if (userMessage) newMessages.push(userMessage);
          if (aiMessage) newMessages.push(aiMessage);

          this.messages.set(newMessages);
          this.scrollToBottom();
        }
      },
      error: (err) => {
        this.isSending.set(false);
        const msg = err?.error?.message || err?.message || 'Failed to send message to AI assistant.';
        this.errorMessage.set(msg);
      }
    });
  }

  sendPrompt(promptText: string): void {
    this.onSendMessage(promptText);
  }

  onClose(): void {
    this.closeModal.emit();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer?.nativeElement) {
        const el = this.messagesContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 100);
  }
}
