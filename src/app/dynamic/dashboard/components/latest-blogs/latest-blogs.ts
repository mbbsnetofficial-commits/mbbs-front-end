import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { HomeBlog } from '../../../../core/models/home.model';
import { BlogCard } from '../blog-card/blog-card';
import { EmptyState } from '../empty-state/empty-state';
import { SectionHeader } from '../section-header/section-header';

@Component({
  selector: 'app-latest-blogs',
  standalone: true,
  imports: [BlogCard, EmptyState, SectionHeader],
  templateUrl: './latest-blogs.html',
  styleUrl: './latest-blogs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LatestBlogs {
  readonly blogs = input.required<readonly HomeBlog[]>();
}
