import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon, IconName } from '../../../../shared/ui/icon/icon';
import { SectionHeader } from '../section-header/section-header';

interface QuickAction {
  label: string;
  description: string;
  route: string;
  fragment?: string;
  icon: IconName;
  tone: string;
}

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [Icon, RouterLink, SectionHeader],
  templateUrl: './quick-actions.html',
  styleUrl: './quick-actions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickActions {
  protected readonly actions: readonly QuickAction[] = [
    { label: 'Question of the Day', description: 'Build your daily recall', route: '/dynamic/neet', icon: 'daily', tone: 'violet' },
    { label: 'Practice Test', description: 'Test your preparation', route: '/dynamic/neet/quick-test', icon: 'test', tone: 'green' },
    { label: 'Previous Year Questions', description: 'Learn from real papers', route: '/dynamic/neet/previous-year-tests', icon: 'history', tone: 'orange' },
    { label: 'Bookmarks', description: 'Return to saved reads', route: '/dynamic/bookmarks', icon: 'bookmark', tone: 'rose' },
    { label: 'Latest Blogs', description: 'Read fresh insights', route: '/dynamic/blogs', icon: 'blog', tone: 'blue' },
    { label: 'Performance', description: 'See your progress', route: '/dynamic/neet/leaderboard', icon: 'chart', tone: 'cyan' },
    { label: 'Explore Countries', description: 'Discover MBBS pathways', route: '/dynamic/categories', icon: 'globe', tone: 'indigo' }
  ];
}
