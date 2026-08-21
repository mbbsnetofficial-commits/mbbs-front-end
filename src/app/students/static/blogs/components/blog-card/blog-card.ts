import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ImageFallbackDirective } from '../../../../../shared/ui/media/image-fallback.directive';
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
  readonly isLikedSignal = signal<boolean | null>(null);
  readonly clapsCount = signal<number | null>(null);

  protected isLiked(): boolean {
    if (this.isLikedSignal() !== null) {
      return this.isLikedSignal()!;
    }
    if (this.pageStore?.isLiked(this.blog()._id)) {
      return true;
    }
    return (this.blog() as any).isLiked ?? false;
  }

  protected hasValidImage(): boolean {
    const url = this.blog().featuredImage?.url;
    return !!url && !url.includes('example.com');
  }

  protected getAuthorAvatar(): string | null {
    const url = this.blog().author?.profileImage;
    return (!!url && !url.includes('example.com')) ? url : null;
  }

  protected getAuthorInitials(): string {
    const name = this.blog().author?.fullName || 'MBBS';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

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
    if (this.pageStore) {
      const storedCount = this.pageStore.getLikedCount(this.blog()._id, this.blog().totalLikes ?? 0);
      return this.formatCount(storedCount);
    }
    return this.formatCount(this.blog().totalLikes ?? 0);
  }

  protected getCommentsCount(): string {
    return this.formatCount(this.blog().totalComments ?? 0);
  }

  protected getSharesCount(): string {
    return this.formatCount(this.blog().totalShares ?? this.blog().totalViews ?? 0);
  }

  protected toggleBookmark(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    const nextState = !this.isBookmarked();
    this.isBookmarked.set(nextState);
    if (this.pageStore) {
      this.pageStore.toggleBookmark(this.blog().slug);
    }
    // Bind to Swagger save/bookmark API endpoints using MongoDB _id
    this.blogService.saveBlog(this.blog()._id).subscribe({
      error: () => {
        // Optimistic state retained locally
      }
    });
  }

  protected toggleDislike(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.isDisliked.update(d => !d);
  }

  protected addClap(event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    const currentlyLiked = this.isLiked();
    const nextLikedState = !currentlyLiked;
    this.isLikedSignal.set(nextLikedState);

    const rawTotal = this.blog().totalLikes ?? 0;
    let optimisticCount = 0;

    if (this.pageStore) {
      const res = this.pageStore.setLikeState(this.blog()._id, nextLikedState, rawTotal);
      optimisticCount = res.totalLikes;
    } else {
      const base = this.clapsCount() ?? rawTotal;
      optimisticCount = nextLikedState ? base + 1 : Math.max(0, base - 1);
    }

    this.clapsCount.set(optimisticCount);

    if (nextLikedState) {
      // 🟢 Calling LIKE API
      this.blogService.likeBlog(this.blog()._id).subscribe({
        next: (res) => {
          const apiLikes = res.data?.totalLikes;
          if (apiLikes !== undefined && apiLikes > 0) {
            this.clapsCount.set(apiLikes);
          } else {
            this.clapsCount.set(Math.max(1, optimisticCount));
          }
        },
        error: () => {
          this.clapsCount.set(Math.max(1, optimisticCount));
        }
      });
    } else {
      // 🔴 Calling UNLIKE API
      this.blogService.unlikeBlog(this.blog()._id).subscribe({
        next: (res) => {
          if (res.data?.totalLikes !== undefined) {
            this.clapsCount.set(res.data.totalLikes);
          } else {
            this.clapsCount.set(optimisticCount);
          }
        },
        error: () => {
          this.clapsCount.set(optimisticCount);
        }
      });
    }
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
