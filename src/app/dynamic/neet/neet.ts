import { ChangeDetectionStrategy, Component, computed, ElementRef, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../shared/ui/icon/icon';
import { QodComponent } from './qod/qod';
import { PreviousYearQuestions } from './previous-year-questions/previous-year-questions';
import { QuickTest } from './quick-test/quick-test';

export interface NeetCourseItem {
  id: string;
  title: string;
  type: 'Previous Year Test' | 'Practise Test' | 'Custom' | 'Physics' | 'Chemistry' | 'Botany' | 'Zoology';
  stagesCount: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'In Progress' | 'Completed';
  stageInfo: string;
  progressPercent: number;
  progressColor: string;
  dateRange: string;
  learningTime: string;
  score: string;
  scoreNum: number;
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
    PreviousYearQuestions,
    QuickTest
  ],
  templateUrl: './neet.html',
  styleUrl: './neet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NeetComponent {
  private readonly elementRef = inject(ElementRef);

  readonly searchQuery = signal('');
  readonly activeTab = signal<'all' | 'in-progress' | 'completed'>('all');
  readonly filterDropdownOpen = signal(false);
  readonly buildTestModalOpen = signal(false);
  readonly activeTestModalCourse = signal<NeetCourseItem | null>(null);

  readonly sortField = signal<string>('title');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  readonly availableCategories = signal([
    'Previous Year Test',
    'Practise Test',
    'Custom',
    'Physics',
    'Chemistry',
    'Botany',
    'Zoology'
  ]);

  readonly activeCategories = signal<string[]>([]);

  readonly courses = signal<NeetCourseItem[]>(this.generate200Courses());

  readonly filteredCourses = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const tab = this.activeTab();
    const categories = this.activeCategories();
    const field = this.sortField();
    const dir = this.sortDirection();

    let list = this.courses().filter((item) => {
      // Tab filter
      if (tab === 'in-progress' && item.status !== 'In Progress') {
        return false;
      }
      if (tab === 'completed' && item.status !== 'Completed') {
        return false;
      }

      // Filter by selected Type/Category tags
      if (categories.length > 0 && !categories.includes(item.type)) {
        return false;
      }

      // Search query filter
      if (query) {
        return (
          item.title.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query) ||
          item.level.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      }

      return true;
    });

    // Sorting - if user hasn't toggled sortField away from initial default, keep newly added item on top!
    list = [...list].sort((a, b) => {
      let res = 0;
      if (field === 'title') {
        res = a.title.localeCompare(b.title);
      } else if (field === 'type') {
        res = a.type.localeCompare(b.type);
      } else if (field === 'level') {
        const orderMap = { Beginner: 1, Intermediate: 2, Advanced: 3 };
        res = orderMap[a.level] - orderMap[b.level];
      } else if (field === 'status') {
        res = a.status.localeCompare(b.status);
      } else if (field === 'progress') {
        res = a.progressPercent - b.progressPercent;
      } else if (field === 'time') {
        res = this.parseMinutes(a.learningTime) - this.parseMinutes(b.learningTime);
      } else if (field === 'score') {
        res = a.scoreNum - b.scoreNum;
      }
      return dir === 'asc' ? res : -res;
    });

    return list;
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.filterDropdownOpen()) return;
    const target = event.target as HTMLElement;
    const dropdownWrap = this.elementRef.nativeElement.querySelector('.filter-dropdown-wrap');
    if (dropdownWrap && !dropdownWrap.contains(target)) {
      this.filterDropdownOpen.set(false);
    }
  }

  @HostListener('window:open-build-test')
  onOpenBuildTest(): void {
    this.buildTestModalOpen.set(true);
  }

  onTestSaved(payload: { title: string; subjects: string[]; chapters: string[]; questionCount: number; duration: number }): void {
    const validTypes: NeetCourseItem['type'][] = [
      'Previous Year Test',
      'Practise Test',
      'Custom',
      'Physics',
      'Chemistry',
      'Botany',
      'Zoology'
    ];

    const typeVal: NeetCourseItem['type'] =
      payload.subjects.length === 1 && validTypes.includes(payload.subjects[0] as any)
        ? (payload.subjects[0] as NeetCourseItem['type'])
        : 'Custom';

    const newCourse: NeetCourseItem = {
      id: Date.now().toString(),
      title: payload.title || 'NEET Custom Practice Test',
      type: typeVal,
      stagesCount: `${payload.chapters.length} Chapters`,
      level: 'Intermediate',
      status: 'In Progress',
      stageInfo: 'Stage 1',
      progressPercent: 0,
      progressColor: '#ff5252',
      dateRange: 'Just now',
      learningTime: '0h 0m',
      score: '0 / 720',
      scoreNum: 0,
      category: `${payload.subjects.join(', ')} • ${payload.questionCount} Qs`,
      iconBg: '#f05a28',
      iconName: 'sparkles'
    };

    // Prepend to top of table so it appears FIRST!
    this.courses.update((current) => [newCourse, ...current]);
    this.buildTestModalOpen.set(false);
  }

  closeBuildTestModal(): void {
    this.buildTestModalOpen.set(false);
  }

  startCourseTest(course: NeetCourseItem): void {
    this.activeTestModalCourse.set(course);
  }

  closeCourseTestModal(): void {
    this.activeTestModalCourse.set(null);
  }

  toggleSort(field: string): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

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

  toggleFilterDropdown(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.filterDropdownOpen.update((val) => !val);
  }

  isCategorySelected(cat: string): boolean {
    return this.activeCategories().includes(cat);
  }

  private parseMinutes(timeStr: string): number {
    const hoursMatch = timeStr.match(/(\d+)h/);
    const minsMatch = timeStr.match(/(\d+)m/);
    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const mins = minsMatch ? parseInt(minsMatch[1], 10) : 0;
    return hours * 60 + mins;
  }

  private generate200Courses(): NeetCourseItem[] {
    const types: NeetCourseItem['type'][] = [
      'Previous Year Test',
      'Practise Test',
      'Custom',
      'Physics',
      'Chemistry',
      'Botany',
      'Zoology'
    ];

    const levels: NeetCourseItem['level'][] = ['Beginner', 'Intermediate', 'Advanced'];

    const physicsTopics = [
      'Laws of Motion & Friction Drill',
      'Thermodynamics & Heat Transfer',
      'Electrostatics & Capacitance Test',
      'Ray Optics & Optical Instruments',
      'Rotational Dynamics Practice',
      'Modern Physics & Photoelectric Effect',
      'Work, Energy & Power Quiz',
      'Gravitation & Satellite Motion',
      'Current Electricity & Circuits',
      'Wave Optics & Interference'
    ];

    const chemistryTopics = [
      'Organic Reaction Mechanisms Practice',
      'Chemical Equilibrium & Le Chatelier',
      'Periodic Table Trends & Bonding',
      'Aldehydes, Ketones & Carboxylic Acids',
      'Coordination Chemistry & Isomerism',
      'Electrochemistry & Nernst Equation',
      'Solutions & Colligative Properties',
      'Thermodynamics & Enthalpy',
      'Biomolecules & Polymers Drill',
      'Chemical Kinetics & Order of Reaction'
    ];

    const botanyTopics = [
      'Plant Kingdom & Algae Taxonomy',
      'Photosynthesis in Higher Plants',
      'Respiration in Plants & ATP Yield',
      'Genetics & Mendelian Inheritance',
      'Cell Division: Mitosis & Meiosis',
      'Plant Growth & Phytohormones',
      'Ecology: Ecosystem Energy Flow',
      'Morphology of Flowering Plants',
      'Anatomy of Dicot & Monocot Stem',
      'Biodiversity & Conservation Strategy'
    ];

    const zoologyTopics = [
      'Human Physiology: Circulation & Blood',
      'Neural Control & Synaptic Conduction',
      'Excretory Products & Osmoregulation',
      'Human Reproduction & Embryology',
      'Animal Kingdom & Chordate Classification',
      'Breathing & Gas Exchange Mechanisms',
      'Biotechnology: Recombinant DNA Tech',
      'Locomotion & Skeletal System',
      'Endocrine System & Hormonal Control',
      'Evolution & Hardy-Weinberg Equilibrium'
    ];

    const pyqTopics = [
      'NEET 2025 Full Syllabus Past Paper',
      'NEET 2024 Phase I Official Paper',
      'NEET 2023 All-India Memory Paper',
      'NEET 2022 Re-Exam Test Series',
      'NEET 2021 National Mock Paper'
    ];

    const practiceTopics = [
      'All-India NEET Full Speed Mock 01',
      'Biophysics Integrated Chapter Test',
      'High-Yield NCERT Line-by-Line Mock',
      'Sprint Revision Grand Test 04',
      'Rank Booster Speed Drill 08'
    ];

    const customTopics = [
      'Custom Mechanics 50-Q Sprint',
      'Personalized Organic Chemistry Drill',
      'Custom Botany Genetics Timed Test',
      'Custom Human Anatomy Quiz 30',
      'Tailored Grand Mock Test 12'
    ];

    const colors = ['#ff6b4a', '#34d399', '#ff4081', '#26c6da', '#42a5f5', '#7e57c2', '#78909c', '#f59e0b', '#10b981', '#6366f1'];
    const icons = ['test', 'chat', 'sparkles', 'like', 'flame', 'profile', 'bookmark', 'check'];
    const progressColors = ['#ff5252', '#ff9800', '#2979ff', '#34d399', '#8b5cf6'];

    const list: NeetCourseItem[] = [];

    for (let i = 1; i <= 200; i++) {
      const type = types[(i - 1) % types.length];
      const level = levels[(i - 1) % levels.length];
      const status: NeetCourseItem['status'] = i % 3 === 0 ? 'Completed' : 'In Progress';
      const progressPercent = status === 'Completed' ? 100 : Math.min(95, Math.max(15, ((i * 17) % 85) + 10));

      let title = '';
      let category = '';

      if (type === 'Physics') {
        title = physicsTopics[(i - 1) % physicsTopics.length];
        category = 'Physics Mechanics & Dynamics';
      } else if (type === 'Chemistry') {
        title = chemistryTopics[(i - 1) % chemistryTopics.length];
        category = 'Organic & Inorganic Chemistry';
      } else if (type === 'Botany') {
        title = botanyTopics[(i - 1) % botanyTopics.length];
        category = 'Botany & Plant Physiology';
      } else if (type === 'Zoology') {
        title = zoologyTopics[(i - 1) % zoologyTopics.length];
        category = 'Zoology & Human Physiology';
      } else if (type === 'Previous Year Test') {
        title = pyqTopics[(i - 1) % pyqTopics.length];
        category = 'NEET Official Past Papers';
      } else if (type === 'Practise Test') {
        title = practiceTopics[(i - 1) % practiceTopics.length];
        category = 'Full Mock Practice';
      } else {
        title = customTopics[(i - 1) % customTopics.length];
        category = 'Personalized Practice Session';
      }

      const scoreVal = Math.min(720, Math.max(380, 420 + ((i * 23) % 290)));
      const hours = Math.floor((i * 3) % 18) + 1;
      const mins = Math.floor((i * 11) % 59);

      let colorTrack = progressColors[0];
      if (progressPercent >= 100) colorTrack = progressColors[3];
      else if (progressPercent >= 75) colorTrack = progressColors[2];
      else if (progressPercent >= 40) colorTrack = progressColors[1];

      list.push({
        id: i.toString(),
        title: `${title} #${i}`,
        type,
        stagesCount: `${(i % 12) + 3} Stages`,
        level,
        status,
        stageInfo: `Stage ${(i % 5) + 1}`,
        progressPercent,
        progressColor: colorTrack,
        dateRange: status === 'Completed' ? `0${(i % 8) + 1} - 1${(i % 8) + 5} Jan 2026` : `${(i % 25) + 1} Jan 2026`,
        learningTime: `${hours}h ${mins}m`,
        score: `${scoreVal} / 720`,
        scoreNum: scoreVal,
        category,
        iconBg: colors[i % colors.length],
        iconName: icons[i % icons.length]
      });
    }

    return list;
  }
}
