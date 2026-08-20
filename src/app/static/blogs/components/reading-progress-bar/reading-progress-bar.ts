import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';

@Component({
  selector: 'app-reading-progress-bar',
  standalone: true,
  template: `<div class="track" aria-hidden="true"><span [style.width.%]="progress()"></span></div>`,
  styles: [`.track{position:fixed;z-index:100;top:0;left:0;right:0;height:3px;background:transparent}.track span{display:block;height:100%;background:#49c5a8;transition:width .08s linear}`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReadingProgressBar {
  private readonly document = inject(DOCUMENT);
  readonly progress = signal(0);

  @HostListener('window:scroll')
  protected update(): void {
    const element = this.document.documentElement;
    const available = element.scrollHeight - element.clientHeight;
    this.progress.set(available > 0 ? Math.min(100, (element.scrollTop / available) * 100) : 0);
  }
}
