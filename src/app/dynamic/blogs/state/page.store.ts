import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, finalize } from 'rxjs';

import { Author } from '../models/author.model';
import { PageHomeResponse } from '../models/page-home-response.model';
import { PageService } from '../services/page.service';

@Injectable()
export class PageStore {
  private readonly pageService = inject(PageService);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly homeResponseState = signal<PageHomeResponse | null>(null);
  private readonly fetchedAuthorsState = signal<Author[]>([]);
  private hasLoaded = false;

  private readonly activeTabState = signal<'forYou' | 'featured'>('forYou');
  private readonly selectedCategorySlugState = signal<string | null>(null);
  private readonly bookmarkedSlugsState = signal<string[]>([]);
  private readonly likedBlogIdsState = signal<string[]>(this.getInitialLikedIds());
  private readonly likedCountsState = signal<Record<string, number>>(this.getInitialLikedCounts());

  private getInitialLikedIds(): string[] {
    try {
      return JSON.parse(localStorage.getItem('liked_blogs') || '[]');
    } catch {
      return [];
    }
  }

  private getInitialLikedCounts(): Record<string, number> {
    try {
      return JSON.parse(localStorage.getItem('liked_blog_counts') || '{}');
    } catch {
      return {};
    }
  }

  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly homeResponse = this.homeResponseState.asReadonly();
  readonly activeTab = this.activeTabState.asReadonly();
  readonly selectedCategorySlug = this.selectedCategorySlugState.asReadonly();
  readonly bookmarkedSlugs = this.bookmarkedSlugsState.asReadonly();

  setLikeState(blogId: string, nextLikedState: boolean, currentTotalLikes: number): { isLiked: boolean; totalLikes: number } {
    const ids = this.likedBlogIdsState();
    const counts = { ...this.likedCountsState() };

    if (!nextLikedState) {
      // Unliking
      const nextIds = ids.filter(id => id !== blogId);
      const base = counts[blogId] ?? currentTotalLikes;
      const nextCount = Math.max(0, base - 1);
      counts[blogId] = nextCount;

      this.likedBlogIdsState.set(nextIds);
      this.likedCountsState.set(counts);
      try {
        localStorage.setItem('liked_blogs', JSON.stringify(nextIds));
        localStorage.setItem('liked_blog_counts', JSON.stringify(counts));
      } catch {}
      return { isLiked: false, totalLikes: nextCount };
    } else {
      // Liking
      const nextIds = ids.includes(blogId) ? ids : [...ids, blogId];
      const base = counts[blogId] ?? currentTotalLikes;
      const nextCount = Math.max(1, base + 1);
      counts[blogId] = nextCount;

      this.likedBlogIdsState.set(nextIds);
      this.likedCountsState.set(counts);
      try {
        localStorage.setItem('liked_blogs', JSON.stringify(nextIds));
        localStorage.setItem('liked_blog_counts', JSON.stringify(counts));
      } catch {}
      return { isLiked: true, totalLikes: nextCount };
    }
  }

  isLiked(blogId: string): boolean {
    return this.likedBlogIdsState().includes(blogId);
  }

  getLikedCount(blogId: string, defaultTotal: number): number {
    if (this.likedCountsState()[blogId] !== undefined) {
      return this.likedCountsState()[blogId];
    }
    if (this.isLiked(blogId)) {
      return Math.max(1, defaultTotal || 1);
    }
    return defaultTotal || 0;
  }

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

  /** All Authors computed from API endpoints */
  readonly allAuthors = computed(() => {
    const apiAuthors = this.fetchedAuthorsState();
    const map = new Map<string, Author>();

    // 1. Add authors fetched directly from GET /pages/authors
    apiAuthors.forEach(a => map.set(a._id || a.slug, a));

    // 2. Add featured authors
    (this.homeResponseState()?.data.content.featuredAuthors ?? []).forEach(a => {
      if (!map.has(a._id || a.slug)) {
        map.set(a._id || a.slug, a);
      }
    });

    // 3. Add authors from blog feeds
    [...this.featuredBlogs(), ...this.latestBlogs()].forEach(b => {
      if (b.author && (b.author._id || b.author.slug) && !map.has(b.author._id || b.author.slug)) {
        map.set(b.author._id || b.author.slug, {
          _id: b.author._id || b.author.slug,
          fullName: b.author.fullName,
          slug: b.author.slug,
          designation: b.author.designation || 'Medical Content Specialist',
          bio: b.author.bio || 'Medical Author',
          profileImage: b.author.profileImage || '',
          totalBlogs: 5
        } as Author);
      }
    });

    return Array.from(map.values());
  });

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

    forkJoin({
      home: this.pageService.getHomePage(),
      authorsRes: this.pageService.getAllAuthors()
    }).pipe(
      finalize(() => this.loadingState.set(false))
    ).subscribe({
      next: ({ home, authorsRes }) => {
        this.homeResponseState.set(home);
        if (authorsRes?.data?.authors) {
          this.fetchedAuthorsState.set(authorsRes.data.authors);
        }
        this.hasLoaded = true;
      },
      error: (error: unknown) => {
        // Fallback: Try fetching home page alone if authors API fails
        this.pageService.getHomePage().subscribe({
          next: (home) => {
            this.homeResponseState.set(home);
            this.hasLoaded = true;
          },
          error: (err) => {
            console.error('Failed to load the blog home page.', err);
            this.errorState.set('We could not load the blog right now. Please try again.');
          }
        });
      }
    });
  }

  retry(): void {
    this.hasLoaded = false;
    this.loadHomePage();
  }
}
