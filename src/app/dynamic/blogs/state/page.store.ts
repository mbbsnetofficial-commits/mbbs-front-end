import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { PageHomeResponse } from '../models/page-home-response.model';
import { PageService } from '../services/page.service';

@Injectable()
export class PageStore {
  private readonly pageService = inject(PageService);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly homeResponseState = signal<PageHomeResponse | null>(null);
  private hasLoaded = false;

  private readonly activeTabState = signal<'forYou' | 'featured'>('forYou');
  private readonly selectedCategorySlugState = signal<string | null>(null);
  private readonly bookmarkedSlugsState = signal<string[]>([]);

  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly homeResponse = this.homeResponseState.asReadonly();
  readonly activeTab = this.activeTabState.asReadonly();
  readonly selectedCategorySlug = this.selectedCategorySlugState.asReadonly();
  readonly bookmarkedSlugs = this.bookmarkedSlugsState.asReadonly();

  readonly featuredBlogs = computed(
    () => this.homeResponseState()?.data.content.featuredBlogs ?? []
  );
  readonly latestBlogs = computed(
    () => this.homeResponseState()?.data.content.latestBlogs ?? []
  );
  readonly categories = computed(
    () => this.homeResponseState()?.data.content.categories ?? []
  );
  readonly featuredAuthors = computed(
    () => this.homeResponseState()?.data.content.featuredAuthors ?? []
  );

  readonly feedBlogs = computed(() => {
    const tab = this.activeTabState();
    const categorySlug = this.selectedCategorySlugState();
    let blogs = tab === 'featured' ? this.featuredBlogs() : [...this.featuredBlogs(), ...this.latestBlogs()];

    // Remove duplicates if any
    const seen = new Set<string>();
    blogs = blogs.filter(b => {
      if (seen.has(b._id)) return false;
      seen.add(b._id);
      return true;
    });

    if (categorySlug) {
      blogs = blogs.filter(b => b.category?.slug === categorySlug || b.category?.categoryName?.toLowerCase() === categorySlug.toLowerCase());
    }

    return blogs;
  });

  setActiveTab(tab: 'forYou' | 'featured'): void {
    this.activeTabState.set(tab);
    this.selectedCategorySlugState.set(null);
  }

  selectCategory(categorySlug: string | null): void {
    if (this.selectedCategorySlugState() === categorySlug) {
      this.selectedCategorySlugState.set(null);
    } else {
      this.selectedCategorySlugState.set(categorySlug);
    }
  }

  toggleBookmark(slug: string): void {
    const current = this.bookmarkedSlugsState();
    if (current.includes(slug)) {
      this.bookmarkedSlugsState.set(current.filter(s => s !== slug));
    } else {
      this.bookmarkedSlugsState.set([...current, slug]);
    }
  }

  isBookmarked(slug: string): boolean {
    return this.bookmarkedSlugsState().includes(slug);
  }

  loadHomePage(): void {
    if (this.loadingState() || this.hasLoaded) {
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null);

    this.pageService.getHomePage().pipe(
      finalize(() => this.loadingState.set(false))
    ).subscribe({
      next: (response) => {
        this.homeResponseState.set(response);
        this.hasLoaded = true;
      },
      error: (error: unknown) => {
        console.error('Failed to load the blog home page.', error);
        this.errorState.set('We could not load the blog right now. Please try again.');
      }
    });
  }

  retry(): void {
    this.hasLoaded = false;
    this.loadHomePage();
  }
}
