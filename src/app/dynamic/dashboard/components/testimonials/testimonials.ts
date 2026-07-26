import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { Testimonial } from '../../../../core/models/home.model';
import { Icon } from '../../../../shared/ui/icon/icon';
import { ImageFallbackDirective } from '../../../../shared/ui/media/image-fallback.directive';
import { MediaUrlPipe } from '../../../../shared/ui/media/media-url.pipe';
import { EmptyState } from '../empty-state/empty-state';
import { SectionHeader } from '../section-header/section-header';

@Component({
  selector: 'app-dashboard-testimonials',
  standalone: true,
  imports: [EmptyState, Icon, ImageFallbackDirective, MediaUrlPipe, SectionHeader],
  templateUrl: './testimonials.html',
  styleUrl: './testimonials.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Testimonials {
  readonly testimonials = input.required<readonly Testimonial[]>();
  protected readonly activeIndex = signal(0);
  protected readonly active = computed(() => this.testimonials()[this.activeIndex()] ?? null);

  protected move(direction: -1 | 1): void {
    const count = this.testimonials().length;
    if (!count) {
      return;
    }
    this.activeIndex.update((index) => (index + direction + count) % count);
  }
}
