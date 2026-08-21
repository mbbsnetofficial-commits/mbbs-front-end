import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { AuthorCard } from '../../components/author-card/author-card';
import { ErrorState } from '../../components/error-state/error-state';
import { FeaturedBlogs } from '../../components/featured-blogs/featured-blogs';
import { LatestBlogs } from '../../components/latest-blogs/latest-blogs';
import { Loading } from '../../components/loading/loading';
import { PageStore } from '../../state/page.store';
import { Icon } from '../../../../../shared/ui/icon/icon';

@Component({
  selector: 'app-blog-home',
  standalone: true,
  imports: [AuthorCard, ErrorState, FeaturedBlogs, LatestBlogs, Loading, Icon],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogHome implements OnInit {
  readonly store = inject(PageStore);
  readonly showBanner = signal(true);

  readonly defaultRecommendedTopics = [
    { name: 'NEET Preparation', slug: 'neet-preparation' },
    { name: 'MBBS Abroad', slug: 'mbbs-abroad' },
    { name: 'University Guidance', slug: 'university-guidance' },
    { name: 'Clinical Learning', slug: 'clinical-learning' },
    { name: 'Admissions', slug: 'admissions' },
    { name: 'Student Life', slug: 'student-life' },
  ];

  ngOnInit(): void {
    this.store.loadHomePage();
  }

  dismissBanner(): void {
    this.showBanner.set(false);
  }
}
