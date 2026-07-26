import { DatePipe, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { HomeBlog } from '../../../core/models/home.model';
import { HomeService } from '../../../core/serivce/home.service';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './blog-detail.html',
  styleUrl: './blog-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly homeService = inject(HomeService);
  private readonly document = inject(DOCUMENT);

  protected readonly blog = signal<HomeBlog | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly copied = signal(false);
  protected readonly progress = signal(0);
  protected readonly paragraphs = computed(() =>
    this.blog()?.content?.blocks?.filter(({ type }) => type === 'paragraph').length ?? 0
  );

  constructor() {
    this.route.paramMap.pipe(
      switchMap((params) => {
        this.loading.set(true);
        this.notFound.set(false);
        this.blog.set(null);
        return this.homeService.getBlogBySlug(params.get('slug') ?? '');
      })
    ).subscribe({
      next: (blog) => {
        this.loading.set(false);
        if (!blog) {
          this.notFound.set(true);
          return;
        }
        this.blog.set(blog);
        this.document.defaultView?.scrollTo({ top: 0 });
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      }
    });

  }

  @HostListener('window:scroll')
  protected updateReadingProgress(): void {
    const root = this.document.documentElement;
    const distance = root.scrollHeight - root.clientHeight;
    this.progress.set(distance > 0 ? Math.min(100, (root.scrollTop / distance) * 100) : 0);
  }

  protected safeImageUrl(url: string): string {
    return url.startsWith('http://res.cloudinary.com/')
      ? url.replace('http://', 'https://')
      : url;
  }

  protected imageFailed(event: Event): void {
    (event.target as HTMLImageElement).classList.add('image-failed');
  }

  protected async share(blog: HomeBlog): Promise<void> {
    const data = { title: blog.title, text: blog.excerpt, url: this.document.location.href };
    if (navigator.share) {
      await navigator.share(data).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(data.url);
    this.copied.set(true);
    this.document.defaultView?.setTimeout(() => this.copied.set(false), 1800);
  }

  protected goBack(): void {
    if (this.document.referrer) {
      this.document.defaultView?.history.back();
    } else {
      this.router.navigate(['/dynamic/dashboard']);
    }
  }
}
