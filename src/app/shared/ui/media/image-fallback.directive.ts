import { Directive, HostBinding, HostListener } from '@angular/core';

@Directive({
  selector: 'img[appImageFallback]',
  standalone: true
})
export class ImageFallbackDirective {
  @HostBinding('class.image-failed')
  protected failed = false;

  @HostListener('error')
  protected onError(): void {
    this.failed = true;
  }
}
