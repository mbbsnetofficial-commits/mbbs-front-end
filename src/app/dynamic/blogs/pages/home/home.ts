import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { AuthorCard } from '../../components/author-card/author-card';
import { CommunityFeed } from '../../components/community-feed/community-feed';
import { EmptyState } from '../../components/empty-state/empty-state';
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
    CommunityFeed,
    EmptyState,
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

  ngOnInit(): void {
    this.store.loadHomePage();
  }
}
