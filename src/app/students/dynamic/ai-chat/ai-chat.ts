import {
  AfterViewInit,
  ChangeDetectionStrategy,
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

  readonly promptText = signal('');
  readonly loading = signal(false);
  readonly lastGroundedSources = signal<GroundedSourcesCount | null>(null);
  readonly messages = signal<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);

  readonly canSend = computed(
    () => !this.loading() && this.promptText().trim().length > 0
  );

  ngAfterViewInit(): void {
    this.scrollToBottom();
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

    this.messages.update((list) => [...list, userMsg]);
    this.promptText.set('');
    this.scrollToBottom();

    this.loading.set(true);

    this.aiChatService
      .sendMessage(text)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.scrollToBottom();
        })
      )
      .subscribe({
        next: (res) => {
          const responseText = res?.data?.response || DEFAULT_ERROR_MESSAGE;
          const assistantMsg: ChatMessage = {
            id: String(Date.now() + 1),
            sender: 'assistant',
            text: responseText,
            groundedSourcesCount: res?.data?.groundedSourcesCount,
          };
          if (res?.data?.groundedSourcesCount) {
            this.lastGroundedSources.set(res.data.groundedSourcesCount);
          }
          this.messages.update((list) => [...list, assistantMsg]);
        },
        error: () => {
          const errorMsg: ChatMessage = {
            id: String(Date.now() + 1),
            sender: 'assistant',
            text: DEFAULT_ERROR_MESSAGE,
            isError: true,
          };
          this.messages.update((list) => [...list, errorMsg]);
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
      this.messages.update((list) => [...list, userMsg]);
      this.scrollToBottom();
      input.value = '';
    }
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
    }, 50);
  }
}
