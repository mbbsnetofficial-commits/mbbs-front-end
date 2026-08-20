import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { ArticleRenderer } from '../../components/article-renderer/article-renderer';
import { BlogHero } from '../../components/blog-hero/blog-hero';
import { Comments } from '../../components/comments/comments';
import { EmptyState } from '../../components/empty-state/empty-state';
import { ErrorState } from '../../components/error-state/error-state';
import { FaqSection } from '../../components/faq-section/faq-section';
import { Gallery } from '../../components/gallery/gallery';
import { Loading } from '../../components/loading/loading';
import { ReadingProgressBar } from '../../components/reading-progress-bar/reading-progress-bar';
import { RelatedBlogs } from '../../components/related-blogs/related-blogs';
import { VideoSection } from '../../components/video-section/video-section';
import { Blog } from '../../models/blog.model';
import { PageStore } from '../../state/page.store';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [
    ArticleRenderer,
    BlogHero,
    Comments,
    EmptyState,
    ErrorState,
    FaqSection,
    Gallery,
    Loading,
    ReadingProgressBar,
    RelatedBlogs,
    RouterLink,
    VideoSection
  ],
  templateUrl: './blog-detail.html',
  styleUrl: './blog-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogDetail implements OnInit {
  readonly store = inject(PageStore);
  private readonly route = inject(ActivatedRoute);
  private readonly slug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug'))),
    { initialValue: this.route.snapshot.paramMap.get('slug') }
  );

  readonly blogs = computed(() => {
    const seen = new Set<string>();
    return [...this.store.featuredBlogs(), ...this.store.latestBlogs()]
      .filter((blog) => !seen.has(blog._id) && Boolean(seen.add(blog._id)));
  });
  readonly blog = computed(
    () => this.blogs().find((item) => item.slug === this.slug()) ?? null
  );
  readonly previousBlog = computed(() => this.adjacentBlog(-1));
  readonly nextBlog = computed(() => this.adjacentBlog(1));

  ngOnInit(): void {
    this.store.loadHomePage();
  }

  private adjacentBlog(offset: number): Blog | null {
    const current = this.blog();
    if (!current) {
      return null;
    }
    const index = this.blogs().findIndex((item) => item._id === current._id);
    return this.blogs()[index + offset] ?? null;
  }
}
