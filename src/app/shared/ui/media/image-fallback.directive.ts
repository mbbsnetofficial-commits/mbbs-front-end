import { Directive, ElementRef, HostBinding, HostListener, inject, input } from '@angular/core';

@Directive({
  selector: 'img[appImageFallback]',
  standalone: true
})
export class ImageFallbackDirective {
  private readonly el = inject(ElementRef<HTMLImageElement>);

  /** Optional custom fallback image URL */
  readonly fallbackSrc = input<string | null>(null);

  @HostBinding('class.image-failed')
  protected failed = false;

  @HostListener('error')
  protected onError(): void {
    if (this.failed) return;
    this.failed = true;
    const fallback = this.fallbackSrc();
    if (fallback && this.el.nativeElement.src !== fallback) {
      this.el.nativeElement.src = fallback;
    } else {
      this.el.nativeElement.style.display = 'none';
    }
  }
}
