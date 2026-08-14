import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../shared/ui/icon/icon';

export interface NeetCourseItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  iconBg: string;
  iconName: string;
  stageInfo: string;
  progressPercent: number;
  progressColor: string;
  status: 'In Progress' | 'Completed';
  learningTime: string;
  actionType: 'none' | 'certificate' | 'review';
  actionText?: string;
}

@Component({
  selector: 'app-neet',
  standalone: true,
  imports: [Icon, RouterLink, FormsModule],
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
      subtitle: '8 Stages • Advanced',
      category: 'Human Resources',
      iconBg: '#ff6b4a',
      iconName: 'test',
      stageInfo: 'Stages 2',
      progressPercent: 25,
      progressColor: '#ff5252',
      status: 'In Progress',
      learningTime: '2h 13m',
      actionType: 'none',
      actionText: 'Not yet available'
    },
    {
      id: '2',
      title: 'Negotiation Skills Role-Play: Closing...',
      subtitle: '18 Stages • Beginner',
      category: 'Leadership',
      iconBg: '#34d399',
      iconName: 'chat',
      stageInfo: 'Stages 4',
      progressPercent: 31,
      progressColor: '#ff9800',
      status: 'In Progress',
      learningTime: '2h 13m',
      actionType: 'none',
      actionText: 'Not yet available'
    },
    {
      id: '3',
      title: 'Conflict Resolution Role-Play Training',
      subtitle: '12 Stages • Intermediate',
      category: 'Conflict Management',
      iconBg: '#ff4081',
      iconName: 'chat',
      stageInfo: 'Stages 6',
      progressPercent: 50,
      progressColor: '#2979ff',
      status: 'In Progress',
      learningTime: '9h 34m',
      actionType: 'none',
      actionText: 'Not yet available'
    },
    {
      id: '4',
      title: 'Public Speaking Role-Play for Professionals',
      subtitle: '8 Stages • Intermediate',
      category: 'Communication Skills',
      iconBg: '#26c6da',
      iconName: 'sparkles',
      stageInfo: 'Stages 7',
      progressPercent: 87,
      progressColor: '#2979ff',
      status: 'In Progress',
      learningTime: '12h 37m',
      actionType: 'none',
      actionText: 'Not yet available'
    },
    {
      id: '5',
      title: 'Customer Service Role-Play for Frontline',
      subtitle: '4 Stages • Advanced',
      category: 'Team Building',
      iconBg: '#42a5f5',
      iconName: 'like',
      stageInfo: 'Stages 4',
      progressPercent: 100,
      progressColor: '#34d399',
      status: 'Completed',
      learningTime: '6h 21m',
      actionType: 'certificate',
      actionText: 'Certificate received'
    },
    {
      id: '6',
      title: 'Sales Pitch Role-Play: Closing Deals...',
      subtitle: '5 Stages • Beginner',
      category: 'Problem-Solving',
      iconBg: '#7e57c2',
      iconName: 'flame',
      stageInfo: 'Stages 6',
      progressPercent: 33,
      progressColor: '#ff9800',
      status: 'In Progress',
      learningTime: '4h 9m',
      actionType: 'none',
      actionText: 'Not yet available'
    },
    {
      id: '7',
      title: 'Leadership Role-Play: Inspiring Teams',
      subtitle: '13 Stages • Beginner',
      category: 'Leadership',
      iconBg: '#78909c',
      iconName: 'profile',
      stageInfo: 'Stages 5',
      progressPercent: 100,
      progressColor: '#34d399',
      status: 'Completed',
      learningTime: '18h 21m',
      actionType: 'review',
      actionText: 'Pending review'
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

      // Category filter (if categories selected)
      if (categories.length > 0 && !categories.includes(item.category)) {
        // allow fallback match if category is not explicitly strictly filtered or match title
      }

      // Search query filter
      if (query) {
        return (
          item.title.toLowerCase().includes(query) ||
          item.subtitle.toLowerCase().includes(query) ||
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
