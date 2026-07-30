import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ImageFallbackDirective } from '../../../../shared/ui/media/image-fallback.directive';
import { Blog } from '../../models/blog.model';

@Component({
  selector: 'app-blog-card',
  standalone: true,
  imports: [DatePipe, ImageFallbackDirective, RouterLink],
  templateUrl: './blog-card.html',
  styleUrl: './blog-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogCard {
  readonly blog = input.required<Blog>();
  readonly featured = input(false);

  protected displayExcerpt(): string {
    const blog = this.blog();
    const excerpt = blog.excerpt?.trim() ?? '';

    if (!excerpt.startsWith('{"blocks"')) {
      return excerpt;
    }

    return blog.shortDescription?.trim()
      || blog.content?.blocks?.[0]?.text?.trim()
      || '';
  }
}
