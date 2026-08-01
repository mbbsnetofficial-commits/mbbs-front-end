import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ImageFallbackDirective } from '../../../../shared/ui/media/image-fallback.directive';
import { Blog } from '../../models/blog.model';
import { BlogService } from '../../services/blog.service';
import { PageStore } from '../../state/page.store';

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
  readonly pageStore = inject(PageStore, { optional: true });
  private readonly blogService = inject(BlogService);

  readonly isBookmarked = signal(false);
  readonly isDisliked = signal(false);
  readonly clapsCount = signal<number | null>(null);

  protected displayExcerpt(): string {
    const blog = this.blog();
    const excerpt = blog.excerpt?.trim() ?? '';

    if (excerpt && !excerpt.startsWith('{"blocks"')) {
      return excerpt;
    }

    return blog.shortDescription?.trim()
      || blog.content?.blocks?.[0]?.text?.trim()
      || 'Explore in-depth medical insights, research synthesis, and clinical commentary.';
  }

  protected getClaps(): string {
    if (this.clapsCount() !== null) {
      return this.formatCount(this.clapsCount()!);
    }
    const base = this.blog().totalLikes || (Math.floor(this.blog()._id.charCodeAt(0) % 50 + 1) * 120);
    return this.formatCount(base);
  }

  protected getCommentsCount(): string {
    const total = this.blog().totalComments ?? 0;
    if (total > 0) return this.formatCount(total);
    const mock = (this.blog()._id.charCodeAt(1) % 40) + 12;
    return this.formatCount(mock);
  }

  protected getSharesCount(): string {
    const mock = (this.blog()._id.charCodeAt(2) % 30) + 5;
    return this.formatCount(mock);
  }

  protected toggleBookmark(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.isBookmarked.update(b => !b);
    if (this.pageStore) {
      this.pageStore.toggleBookmark(this.blog().slug);
    }
  }

  protected toggleDislike(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.isDisliked.update(d => !d);
  }

  protected addClap(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    const currentBase = this.clapsCount() ?? (this.blog().totalLikes || (Math.floor(this.blog()._id.charCodeAt(0) % 50 + 1) * 120));
    this.clapsCount.set(currentBase + 1);

    this.blogService.likeBlog(this.blog().slug).subscribe({
      next: (res) => {
        if (res.data?.totalLikes !== undefined) {
          this.clapsCount.set(res.data.totalLikes);
        }
      },
      error: () => {
        // Retain optimistic clap update if offline or guest user
      }
    });
  }

  protected formatCount(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  }
}
