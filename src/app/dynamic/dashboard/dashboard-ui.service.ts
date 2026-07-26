import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

import { HomeBlog } from '../../core/models/home.model';
import { BookmarkService } from '../../core/serivce/bookmark.service';

@Injectable()
export class DashboardUiService {
  private readonly document = inject(DOCUMENT);
  private readonly bookmarks = inject(BookmarkService);
  readonly copiedBlogSlug = signal<string | null>(null);
  readonly bookmarkCount = this.bookmarks.count;

  isBookmarked(blogId: string): boolean {
    return this.bookmarks.has(blogId);
  }

  toggleBookmark(blogId: string): void {
    this.bookmarks.toggle(blogId);
  }

  async share(blog: HomeBlog): Promise<void> {
    const url = `${this.document.location.origin}/dynamic/blogs/${blog.slug}`;
    const data = { title: blog.title, text: blog.excerpt || blog.shortDescription, url };
    const navigator = this.document.defaultView?.navigator;

    if (navigator?.share) {
      await navigator.share(data).catch(() => undefined);
      return;
    }

    if (navigator?.clipboard) {
      await navigator.clipboard.writeText(url);
      this.copiedBlogSlug.set(blog.slug);
      this.document.defaultView?.setTimeout(() => this.copiedBlogSlug.set(null), 1800);
    }
  }
}
