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
  readonly blogs = input<Blog[]>([]);

  protected getAuthorAvatar(blog: Blog): string | null {
    const url = blog.author?.profileImage;
    return (!!url && !url.includes('example.com')) ? url : null;
  }

  protected getAuthorInitials(blog: Blog): string {
    const name = blog.author?.fullName || 'MBBS';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
