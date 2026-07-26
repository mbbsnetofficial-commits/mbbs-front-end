import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input
} from '@angular/core';

import { HomeContent } from '../../../../core/models/home.model';
import { Icon, IconName } from '../../../../shared/ui/icon/icon';

interface DashboardStat {
  label: string;
  hint: string;
  icon: IconName;
  tone: 'blue' | 'cyan' | 'green' | 'orange' | 'violet' | 'rose';
  value: number;
  suffix?: string;
}

@Component({
  selector: 'app-dashboard-stats',
  standalone: true,
  imports: [Icon],
  templateUrl: './stats.html',
  styleUrl: './stats.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Stats {
  readonly content = input.required<HomeContent>();
  readonly bookmarkCount = input(0);

  protected readonly items = computed<DashboardStat[]>(() => {
    const content = this.content();
    const readingMinutes = content.latestBlogs.reduce(
      (total, blog) => total + (blog.readingTime || 0),
      0
    );

    return [
      { label: 'Featured blogs', hint: 'Curated by editors', icon: 'sparkles', tone: 'blue', value: content.featuredBlogs.length },
      { label: 'Latest blogs', hint: 'Fresh medical reads', icon: 'blog', tone: 'cyan', value: content.latestBlogs.length },
      { label: 'Categories', hint: 'Learning pathways', icon: 'categories', tone: 'green', value: content.categories.length },
      { label: 'Expert authors', hint: 'Trusted educators', icon: 'authors', tone: 'violet', value: content.featuredAuthors.length },
      { label: 'Reading time', hint: 'Across latest reads', icon: 'clock', tone: 'orange', value: readingMinutes, suffix: ' min' },
      { label: 'Bookmarks', hint: 'Saved articles', icon: 'bookmark', tone: 'rose', value: this.bookmarkCount() },
      { label: 'Questions solved', hint: 'Complete a test to begin', icon: 'check', tone: 'green', value: 0 },
      { label: 'Study streak', hint: 'Practice daily to begin', icon: 'flame', tone: 'orange', value: 0, suffix: ' days' }
    ];
  });
}
