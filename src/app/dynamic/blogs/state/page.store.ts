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

  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly homeResponse = this.homeResponseState.asReadonly();
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
