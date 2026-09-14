import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FAQ_ITEMS, FaqItem } from './landing-faq.model';

@Component({
  selector: 'app-landing-faq',
  templateUrl: './landing-faq.html',
  styleUrl: './landing-faq.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingFaq {
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly faqs: readonly FaqItem[] = FAQ_ITEMS;
  readonly activeId = signal<string | null>(null);
  protected readonly isRevealed = signal(false);

  constructor() {
    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined') {
        this.isRevealed.set(true);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            this.isRevealed.set(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
      );

      observer.observe(this.elementRef.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  toggleItem(id: string): void {
    this.activeId.update((current) => (current === id ? null : id));
  }

  isOpen(id: string): boolean {
    return this.activeId() === id;
  }

  onTriggerKeyDown(event: KeyboardEvent, currentIndex: number): void {
    const triggers = Array.from(
      this.elementRef.nativeElement.querySelectorAll('.faq-trigger'),
    ) as HTMLElement[];

    if (!triggers.length) return;

    let targetIndex = -1;

    switch (event.key) {
      case 'ArrowDown':
        targetIndex = (currentIndex + 1) % triggers.length;
        break;
      case 'ArrowUp':
        targetIndex = (currentIndex - 1 + triggers.length) % triggers.length;
        break;
      case 'Home':
        targetIndex = 0;
        break;
      case 'End':
        targetIndex = triggers.length - 1;
        break;
    }

    if (targetIndex >= 0) {
      event.preventDefault();
      triggers[targetIndex]?.focus();
    }
  }
}
