import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ImageFallbackDirective } from '../../../../shared/ui/media/image-fallback.directive';
import { Blog } from '../../models/blog.model';

@Component({
  selector: 'app-featured-blogs',
  standalone: true,
  imports: [DatePipe, ImageFallbackDirective, RouterLink],
  templateUrl: './featured-blogs.html',
  styleUrl: './featured-blogs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeaturedBlogs {
  readonly blogs = input.required<Blog[]>();
}
