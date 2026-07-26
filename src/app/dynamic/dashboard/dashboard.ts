import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { HomeContent } from '../../core/models/home.model';
import { HomeService } from '../../core/serivce/home.service';
import { Icon } from '../../shared/ui/icon/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    Icon,
    RouterLink
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dashboard {
  private readonly homeService = inject(HomeService);
  private readonly route = inject(ActivatedRoute);

  protected readonly content = signal<HomeContent | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly activeTab = signal<'for-you' | 'featured'>('for-you');
  protected readonly visibleBlogs = computed(() => {
    const content = this.content();
    const blogs = this.activeTab() === 'featured'
      ? content?.featuredBlogs ?? []
      : content?.latestBlogs ?? [];
    const query = this.searchTerm().trim().toLocaleLowerCase();
    if (!query) {
      return blogs;
    }

    return blogs.filter((blog) =>
      [
        blog.title,
        blog.excerpt,
        blog.shortDescription,
        blog.category.categoryName,
        blog.author.fullName
      ].some((value) => value.toLocaleLowerCase().includes(query))
    );
  });

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => this.searchTerm.set(params.get('q') ?? ''));
    this.loadDashboard();
  }

  protected loadDashboard(): void {
    this.loading.set(true);
    this.error.set(false);
    this.homeService.getHome()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ data }) => this.content.set(data.content),
        error: () => this.error.set(true)
      });
  }

  protected safeImageUrl(url: string): string {
    return url.startsWith('http://res.cloudinary.com/')
      ? url.replace('http://', 'https://')
      : url;
  }

  protected imageFailed(event: Event): void {
    (event.target as HTMLImageElement).classList.add('image-failed');
  }
}
