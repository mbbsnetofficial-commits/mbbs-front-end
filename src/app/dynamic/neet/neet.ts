import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../shared/ui/icon/icon';
import { QodComponent } from './qod/qod';
import { PreviousYearQuestions } from './previous-year-questions/previous-year-questions';

export interface NeetCourseItem {
  id: string;
  title: string;
  stagesCount: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'In Progress' | 'Completed';
  stageInfo: string;
  progressPercent: number;
  progressColor: string;
  dateRange: string;
  learningTime: string;
  score: string;
  category: string;
  iconBg: string;
  iconName: string;
}

@Component({
  selector: 'app-neet',
  standalone: true,
  imports: [
    Icon,
    RouterLink,
    FormsModule,
    QodComponent,
    PreviousYearQuestions
  ],
  templateUrl: './neet.html',
  styleUrl: './neet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NeetComponent {
  readonly searchQuery = signal('');
  readonly activeTab = signal<'all' | 'in-progress' | 'completed'>('all');
  readonly filterDropdownOpen = signal(false);

  readonly availableCategories = signal([
    'Human Resources',
    'Leadership',
    'Team Building',
    'Time Management',
    'Conflict Management',
    'Communication Skills',
    'Problem-Solving'
  ]);

  readonly activeCategories = signal<string[]>(['Human Resources', 'Leadership']);

  readonly courses = signal<NeetCourseItem[]>([
    {
      id: '1',
      title: 'Comprehensive Interview Test Role-Play...',
      stagesCount: '8 Stages',
      level: 'Advanced',
      status: 'In Progress',
      stageInfo: 'Stages 2',
      progressPercent: 25,
      progressColor: '#ff5252',
      dateRange: '05 Jan 2026',
      learningTime: '2h 13m',
      score: '72%',
      category: 'Human Resources',
      iconBg: '#ff6b4a',
      iconName: 'test'
    },
    {
      id: '2',
      title: 'Negotiation Skills Role-Play: Closing...',
      stagesCount: '18 Stages',
      level: 'Beginner',
      status: 'In Progress',
      stageInfo: 'Stages 4',
      progressPercent: 31,
      progressColor: '#ff9800',
      dateRange: '12 Jan 2026',
      learningTime: '2h 13m',
      score: '68%',
      category: 'Leadership',
      iconBg: '#34d399',
      iconName: 'chat'
    },
    {
      id: '3',
      title: 'Conflict Resolution Role-Play Training',
      stagesCount: '12 Stages',
      level: 'Intermediate',
      status: 'In Progress',
      stageInfo: 'Stages 6',
      progressPercent: 50,
      progressColor: '#2979ff',
      dateRange: '18 Jan 2026',
      learningTime: '9h 34m',
      score: '80%',
      category: 'Conflict Management',
      iconBg: '#ff4081',
      iconName: 'chat'
    },
    {
      id: '4',
      title: 'Public Speaking Role-Play for Professionals',
      stagesCount: '8 Stages',
      level: 'Intermediate',
      status: 'In Progress',
      stageInfo: 'Stages 7',
      progressPercent: 87,
      progressColor: '#2979ff',
      dateRange: '22 Jan 2026',
      learningTime: '12h 37m',
      score: '89%',
      category: 'Communication Skills',
      iconBg: '#26c6da',
      iconName: 'sparkles'
    },
    {
      id: '5',
      title: 'Customer Service Role-Play for Frontline',
      stagesCount: '4 Stages',
      level: 'Advanced',
      status: 'Completed',
      stageInfo: 'Stages 4',
      progressPercent: 100,
      progressColor: '#34d399',
      dateRange: '01 - 15 Jan 2026',
      learningTime: '6h 21m',
      score: '95%',
      category: 'Team Building',
      iconBg: '#42a5f5',
      iconName: 'like'
    },
    {
      id: '6',
      title: 'Sales Pitch Role-Play: Closing Deals...',
      stagesCount: '5 Stages',
      level: 'Beginner',
      status: 'In Progress',
      stageInfo: 'Stages 6',
      progressPercent: 33,
      progressColor: '#ff9800',
      dateRange: '28 Jan 2026',
      learningTime: '4h 9m',
      score: '74%',
      category: 'Problem-Solving',
      iconBg: '#7e57c2',
      iconName: 'flame'
    },
    {
      id: '7',
      title: 'Leadership Role-Play: Inspiring Teams',
      stagesCount: '13 Stages',
      level: 'Beginner',
      status: 'Completed',
      stageInfo: 'Stages 5',
      progressPercent: 100,
      progressColor: '#34d399',
      dateRange: '08 Jan - 02 Feb 2026',
      learningTime: '18h 21m',
      score: '91%',
      category: 'Leadership',
      iconBg: '#78909c',
      iconName: 'profile'
    }
  ]);

  readonly filteredCourses = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const tab = this.activeTab();
    const categories = this.activeCategories();

    return this.courses().filter((item) => {
      // Tab filter
      if (tab === 'in-progress' && item.status !== 'In Progress') {
        return false;
      }
      if (tab === 'completed' && item.status !== 'Completed') {
        return false;
      }

      // Category filter
      if (categories.length > 0 && !categories.includes(item.category)) {
        // allow fallback match if category is not explicitly strictly filtered or match title
      }

      // Search query filter
      if (query) {
        return (
          item.title.toLowerCase().includes(query) ||
          item.level.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      }

      return true;
    });
  });

  setTab(tab: 'all' | 'in-progress' | 'completed'): void {
    this.activeTab.set(tab);
  }

  toggleCategory(category: string): void {
    this.activeCategories.update((current) => {
      if (current.includes(category)) {
        return current.filter((c) => c !== category);
      }
      return [...current, category];
    });
  }

  removeCategory(category: string): void {
    this.activeCategories.update((current) => current.filter((c) => c !== category));
  }

  toggleFilterDropdown(): void {
    this.filterDropdownOpen.set(!this.filterDropdownOpen());
  }

  isCategorySelected(cat: string): boolean {
    return this.activeCategories().includes(cat);
  }
}
