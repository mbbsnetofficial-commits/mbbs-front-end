import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { HomeBlog } from '../../../../core/models/home.model';
import { Icon } from '../../../../shared/ui/icon/icon';
import { ImageFallbackDirective } from '../../../../shared/ui/media/image-fallback.directive';
import { MediaUrlPipe } from '../../../../shared/ui/media/media-url.pipe';
import { DashboardUiService } from '../../dashboard-ui.service';

@Component({
  selector: 'app-blog-card',
  standalone: true,
  imports: [DatePipe, Icon, ImageFallbackDirective, MediaUrlPipe],
  templateUrl: './blog-card.html',
  styleUrl: './blog-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogCard {
  private readonly router = inject(Router);
  protected readonly ui = inject(DashboardUiService);

  readonly blog = input.required<HomeBlog>();

  protected open(event?: Event): void {
    if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event?.preventDefault();
    this.router.navigate(['/dynamic/blogs', this.blog().slug]);
  }

  protected bookmark(event: Event): void {
    event.stopPropagation();
    this.ui.toggleBookmark(this.blog()._id);
  }

  protected share(event: Event): void {
    event.stopPropagation();
    void this.ui.share(this.blog());
  }
}
