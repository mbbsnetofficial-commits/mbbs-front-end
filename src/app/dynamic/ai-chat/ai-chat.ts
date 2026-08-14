import {
  AfterViewInit,
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
export class AiChat implements AfterViewInit {
  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;

  readonly promptText = signal('');
  readonly selectedModel = signal('Sonnet 5');
  readonly selectedMode = signal('Manual');

  readonly messages = signal<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'Welcome back! I can help you with your NEET PG preparation, medical case studies, certificate text generation, or summary notes. What would you like to review today?'
    },
    {
      id: '2',
      sender: 'user',
      text: 'Can you summarize the key diagnostic criteria for Infective Endocarditis using Duke criteria?'
    },
    {
      id: '3',
      sender: 'assistant',
      text: 'Certainly! The Modified Duke Criteria for Infective Endocarditis requires:\n\n• Major Criteria:\n  - Positive blood culture from 2 separate blood cultures\n  - Evidence of endocardial involvement on echocardiogram (vegetation, abscess, or new valvular regurgitation)\n\n• Minor Criteria:\n  - Predisposing heart condition or IV drug use\n  - Fever ≥ 38.0°C\n  - Vascular phenomena (Janeway lesions, arterial emboli)\n  - Immunologic phenomena (Osler nodes, Roth spots, Rheumatoid factor)\n\nDiagnosis is confirmed with 2 major, 1 major + 3 minor, or 5 minor criteria.'
    },
    {
      id: '4',
      sender: 'user',
      text: 'Can you also write a short paragraph summarizing my completion of the program?'
    },
    {
      id: '5',
      sender: 'assistant',
      text: 'management, resilience, and self-discipline alongside a demanding academic curriculum.'
    },
    {
      id: '6',
      sender: 'assistant',
      text: 'Want either rendered into the certificate?'
    },
    {
      id: '7',
      sender: 'user',
      text: 'This is to certify the successful completion of the program, with demonstrated excellence in full stack development and modern AI technologies — achieved through exceptional time management, resilience, and self-discipline alongside a demanding academic curriculum. Your dedication and pursuit of excellence are truly commendable.'
    },
    {
      id: '8',
      sender: 'assistant',
      text: 'That reads cleanly and has no errors — nicely balanced final version. Want me to render it into the certificate now?'
    },
    {
      id: '9',
      sender: 'user',
      text: 'This is to certify the successful completion of the program, with demonstrated excellence achieved through exceptional time management, resilience, and self-discipline alongside a demanding academic curriculum. Your dedication and pursuit of excellence are truly commendable.'
    },
    {
      id: '10',
      sender: 'assistant',
      text: 'I have generated the updated certificate document with this final wording. You can download it directly or make further edits anytime!'
    },
    {
      id: '11',
      sender: 'user',
      text: 'Thanks! Can you also give me a quick quiz question on Pharmacology for NEET practice?'
    },
    {
      id: '12',
      sender: 'assistant',
      text: 'Here is your practice question:\n\nWhich of the following anti-hypertensive drugs is contraindicated in bilateral renal artery stenosis?\n\nA) Amlodipine\nB) Enalapril\nC) Atenolol\nD) Hydrochlorothiazide\n\nHint: Think about which drug class inhibits efferent arteriolar constriction!'
    }
  ]);

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

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
