import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { AuthorCard } from '../../components/author-card/author-card';
import { ErrorState } from '../../components/error-state/error-state';
import { FeaturedBlogs } from '../../components/featured-blogs/featured-blogs';
import { LatestBlogs } from '../../components/latest-blogs/latest-blogs';
import { Loading } from '../../components/loading/loading';
import { PageStore } from '../../state/page.store';

@Component({
  selector: 'app-blog-home',
  standalone: true,
  imports: [
    AuthorCard,
    ErrorState,
    FeaturedBlogs,
    LatestBlogs,
    Loading
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogHome implements OnInit {
  readonly store = inject(PageStore);
  readonly showBanner = signal(true);

  readonly defaultRecommendedTopics = [
    { name: 'Programming', slug: 'programming' },
    { name: 'Self Improvement', slug: 'self-improvement' },
    { name: 'Data Science', slug: 'data-science' },
    { name: 'Writing', slug: 'writing' },
    { name: 'Technology', slug: 'technology' },
    { name: 'Relationships', slug: 'relationships' }
  ];

  ngOnInit(): void {
    this.store.loadHomePage();
  }

  dismissBanner(): void {
    this.showBanner.set(false);
  }
}
