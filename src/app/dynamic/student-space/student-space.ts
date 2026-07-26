import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { HomeContent } from '../../core/models/home.model';
import { BookmarkService } from '../../core/serivce/bookmark.service';
import { HomeService } from '../../core/serivce/home.service';
import { TokenService } from '../../core/serivce/token.service';
import { Icon } from '../../shared/ui/icon/icon';
import { Authors } from '../dashboard/components/authors/authors';
import { Categories } from '../dashboard/components/categories/categories';
import { EmptyState } from '../dashboard/components/empty-state/empty-state';
import { LatestBlogs } from '../dashboard/components/latest-blogs/latest-blogs';
import { LearningWorkspace } from '../dashboard/components/learning-workspace/learning-workspace';
import { LoadingSkeleton } from '../dashboard/components/loading-skeleton/loading-skeleton';
import { DashboardUiService } from '../dashboard/dashboard-ui.service';

type StudentSpaceView =
  | 'activity'
  | 'authors'
  | 'blogs'
  | 'bookmarks'
  | 'categories'
  | 'profile'
  | 'settings';

@Component({
  selector: 'app-student-space',
  standalone: true,
  imports: [
    Authors,
    Categories,
    EmptyState,
    Icon,
    LatestBlogs,
    LearningWorkspace,
    LoadingSkeleton,
    RouterLink
  ],
  providers: [DashboardUiService],
  templateUrl: './student-space.html',
  styleUrl: './student-space.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentSpace {
  private readonly route = inject(ActivatedRoute);
  private readonly homeService = inject(HomeService);
  private readonly bookmarks = inject(BookmarkService);
  private readonly tokenService = inject(TokenService);

  protected readonly view = this.route.snapshot.data['view'] as StudentSpaceView;
  protected readonly content = signal<HomeContent | null>(null);
  protected readonly loading = signal(this.requiresContent());
  protected readonly error = signal(false);
  protected readonly emailUpdates = signal(true);
  protected readonly studyReminders = signal(false);
  protected readonly userName = this.tokenService.getUserDisplayName();
  protected readonly studentId = this.tokenService.getStudentId();

  protected readonly allBlogs = computed(() => {
    const content = this.content();
    if (!content) {
      return [];
    }
    return [...content.featuredBlogs, ...content.latestBlogs].filter(
      (blog, index, blogs) => blogs.findIndex(({ _id }) => _id === blog._id) === index
    );
  });
  protected readonly savedBlogs = computed(() => this.bookmarks.filter(this.allBlogs()));

  constructor() {
    if (this.requiresContent()) {
      this.load();
    }
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.homeService.getHome()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ data }) => this.content.set(data.content),
        error: () => this.error.set(true)
      });
  }

  private requiresContent(): boolean {
    return !['profile', 'settings'].includes(this.view);
  }
}
