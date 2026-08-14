import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Icon } from '../../shared/ui/icon/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [Icon, FormsModule],
  templateUrl: './ai-chat.html',
  styleUrl: './ai-chat.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiChat {
  readonly promptText = signal('');
  readonly currentMode = signal<'chat' | 'cowork'>('chat');
  
  setMode(mode: 'chat' | 'cowork'): void {
    this.currentMode.set(mode);
  }
}
