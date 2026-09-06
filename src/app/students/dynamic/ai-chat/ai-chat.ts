import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Icon } from '../../../shared/ui/icon/icon';
import { DEFAULT_ERROR_MESSAGE, DEFAULT_WELCOME_MESSAGE } from './constants/ai-chat.constants';
import { ChatMessage, GroundedSourcesCount } from './models/ai-chat.model';
import { SafeMarkdownPipe } from './pipes/safe-markdown.pipe';
import { AiChatService } from './services/ai-chat.service';

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-1',
  sender: 'assistant',
  text: DEFAULT_WELCOME_MESSAGE,
};

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [Icon, FormsModule, SafeMarkdownPipe],
  templateUrl: './ai-chat.html',
  styleUrl: './ai-chat.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChat implements AfterViewInit {
  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;

  private readonly aiChatService = inject(AiChatService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly promptText = signal('');
  readonly loading = this.aiChatService.loading ?? signal(false);
  readonly lastGroundedSources = this.aiChatService.lastGroundedSources ?? signal<GroundedSourcesCount | null>(null);
  readonly messages = this.aiChatService.messages ?? signal<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  readonly showScrollBottom = signal(false);

  readonly canSend = computed(
    () => !this.loading() && this.promptText().trim().length > 0
  );

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  clearChat(): void {
    if (typeof this.aiChatService.clearChat === 'function') {
      this.aiChatService.clearChat();
    } else if ('set' in this.messages) {
      (this.messages as any).set([INITIAL_WELCOME_MESSAGE]);
    }
    this.cdr.markForCheck();
  }

  sendMessage(): void {
    if (!this.canSend()) {
      return;
    }

    const text = this.promptText().trim();
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text,
    };

    if (typeof this.aiChatService.addMessage === 'function') {
      this.aiChatService.addMessage(userMsg);
    } else if ('update' in this.messages) {
      (this.messages as any).update((list: any) => [...list, userMsg]);
    }
    this.promptText.set('');
    this.scrollToBottom();

    if (typeof this.aiChatService.setLoading === 'function') {
      this.aiChatService.setLoading(true);
    } else if ('set' in this.loading) {
      (this.loading as any).set(true);
    }
    this.cdr.markForCheck();

    this.aiChatService
      .sendMessage(text)
      .pipe(
        finalize(() => {
          if (typeof this.aiChatService.setLoading === 'function') {
            this.aiChatService.setLoading(false);
          } else if ('set' in this.loading) {
            (this.loading as any).set(false);
          }
          this.cdr.markForCheck();
          this.scrollToBottom();
        })
      )
      .subscribe({
        next: (res) => {
          const rawData = res?.data as any;
          const responseText =
            rawData?.response ||
            rawData?.reply ||
            rawData?.answer ||
            rawData?.message ||
            rawData?.formattedText ||
            (typeof rawData === 'string' ? rawData : '') ||
            (res as any)?.response ||
            (res as any)?.message ||
            DEFAULT_ERROR_MESSAGE;

          const assistantMsg: ChatMessage = {
            id: String(Date.now() + 1),
            sender: 'assistant',
            text: responseText,
            groundedSourcesCount: rawData?.groundedSourcesCount,
          };
          if (rawData?.groundedSourcesCount) {
            if (typeof this.aiChatService.setLastGroundedSources === 'function') {
              this.aiChatService.setLastGroundedSources(rawData.groundedSourcesCount);
            } else if ('set' in this.lastGroundedSources) {
              (this.lastGroundedSources as any).set(rawData.groundedSourcesCount);
            }
          }
          if (typeof this.aiChatService.addMessage === 'function') {
            this.aiChatService.addMessage(assistantMsg);
          } else if ('update' in this.messages) {
            (this.messages as any).update((list: any) => [...list, assistantMsg]);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('AI Chat Error:', err);
          const errorMsg: ChatMessage = {
            id: String(Date.now() + 1),
            sender: 'assistant',
            text: DEFAULT_ERROR_MESSAGE,
            isError: true,
          };
          if (typeof this.aiChatService.addMessage === 'function') {
            this.aiChatService.addMessage(errorMsg);
          } else if ('update' in this.messages) {
            (this.messages as any).update((list: any) => [...list, errorMsg]);
          }
          this.cdr.markForCheck();
        },
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const userMsg: ChatMessage = {
        id: String(Date.now()),
        sender: 'user',
        text: `📎 Attached file: ${file.name}`,
      };
      if (typeof this.aiChatService.addMessage === 'function') {
        this.aiChatService.addMessage(userMsg);
      } else if ('update' in this.messages) {
        (this.messages as any).update((list: any) => [...list, userMsg]);
      }
      this.scrollToBottom();
      input.value = '';
    }
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    this.showScrollBottom.set(distanceFromBottom > 80);
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const container = this.scrollContainer?.nativeElement;
      if (container) {
        if (typeof container.scrollTo === 'function') {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth',
          });
        } else {
          container.scrollTop = container.scrollHeight;
        }
      }
      this.showScrollBottom.set(false);
    }, 50);
  }
}
