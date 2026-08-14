import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../shared/ui/icon/icon';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [Icon, FormsModule],
  templateUrl: './ai-chat.html',
  styleUrl: './ai-chat.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiChat {
  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;

  readonly promptText = signal('');
  readonly selectedModel = signal('Sonnet 5');
  readonly selectedMode = signal('Manual');

  readonly messages = signal<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'management, resilience, and self-discipline alongside a demanding academic curriculum.'
    },
    {
      id: '2',
      sender: 'assistant',
      text: 'Want either rendered into the certificate?'
    },
    {
      id: '3',
      sender: 'user',
      text: 'This is to certify the successful completion of the program, with demonstrated excellence in full stack development and modern AI technologies — achieved through exceptional time management, resilience, and self-discipline alongside a demanding academic curriculum. Your dedication and pursuit of excellence are truly commendable.'
    },
    {
      id: '4',
      sender: 'assistant',
      text: 'That reads cleanly and has no errors — nicely balanced final version. Want me to render it into the certificate now?'
    },
    {
      id: '5',
      sender: 'user',
      text: 'This is to certify the successful completion of the program, with demonstrated excellence achieved through exceptional time management, resilience, and self-discipline alongside a demanding academic curriculum. Your dedication and pursuit of excellence are truly commendable.'
    }
  ]);

  sendMessage(): void {
    const text = this.promptText().trim();
    if (!text) {
      return;
    }

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text
    };

    this.messages.update((list) => [...list, userMsg]);
    this.promptText.set('');
    this.scrollToBottom();

    // Mock AI response
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: 'I have updated your request with the latest parameters. Let me know if you would like any further adjustments!'
      };
      this.messages.update((list) => [...list, assistantMsg]);
      this.scrollToBottom();
    }, 600);
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const container = this.scrollContainer?.nativeElement;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 50);
  }
}
