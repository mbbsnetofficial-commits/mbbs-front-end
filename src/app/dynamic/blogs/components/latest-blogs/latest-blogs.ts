import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Blog } from '../../models/blog.model';
import { BlogCard } from '../blog-card/blog-card';
import { EmptyState } from '../empty-state/empty-state';

@Component({
  selector: 'app-latest-blogs',
  standalone: true,
  imports: [BlogCard, EmptyState],
  templateUrl: './latest-blogs.html',
  styleUrl: './latest-blogs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LatestBlogs {
  readonly blogs = input.required<Blog[]>();
}
