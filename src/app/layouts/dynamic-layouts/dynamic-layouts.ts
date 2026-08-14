import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';

import { Icon, IconName } from '../../shared/ui/icon/icon';
import { AuthService } from '../../core/serivce/auth.service';
import { TokenService } from '../../core/serivce/token.service';
import { StudentDashboardService } from '../../dynamic/dashboard/services/student-dashboard.service';

interface NavigationItem {
  label: string;
  description: string;
  route: string;
  icon: IconName;
}

interface PageMeta {
  eyebrow: string;
  title: string;
}

@Component({
  selector: 'app-dynamic-layouts',
  standalone: true,
  imports: [Icon, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './dynamic-layouts.html',
  styleUrl: './dynamic-layouts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicLayouts implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly dashboardService = inject(StudentDashboardService);
  private readonly router = inject(Router);

  protected readonly sidebarOpen = signal(false);
  protected readonly loggingOut = signal(false);
  protected readonly commandOpen = signal(false);
  protected readonly notificationOpen = signal(false);
  protected readonly profileOpen = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly pageMeta = signal<PageMeta>({
    eyebrow: 'Student workspace',
    title: 'Dashboard',
  });
  protected readonly unreadCount = signal(0);
  protected readonly notifications = signal<any[]>([]);

  protected readonly user = this.safeCurrentUser();
  protected readonly displayName = this.user
    ? `${this.user.firstName} ${this.user.lastName}`.trim()
    : this.safeDisplayName();
  protected readonly userEmail = this.user?.email ?? 'Student account';
  protected readonly initials =
    this.displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'ST';

  protected readonly destinations: NavigationItem[] = [
    {
      label: 'Dashboard',
      description: 'Preparation overview and saved work',
      route: '/dynamic/dashboard',
      icon: 'dashboard',
    },
    {
      label: 'NEET practice',
      description: 'Daily question and practice options',
      route: '/dynamic/neet',
      icon: 'india',
    },
    {
      label: 'Create NEET test',
      description: 'Build a focused practice session',
      route: '/dynamic/neet/quick-test',
      icon: 'sparkles',
    },
    {
      label: 'Previous NEET papers',
      description: 'Attempt mapped past papers',
      route: '/dynamic/neet',
      icon: 'history',
    },
    {
      label: 'Performance',
      description: 'Rankings and test performance',
      route: '/dynamic/neet/leaderboard',
      icon: 'chart',
    },
    {
      label: 'UCAT practice',
      description: 'Create a UCAT practice session',
      route: '/dynamic/ucat',
      icon: 'activity',
    },
    {
      label: 'Previous UCAT papers',
      description: 'Past-paper test environment',
      route: '/dynamic/ucat/previous-year',
      icon: 'history',
    },
    {
      label: 'University finder',
      description: 'Match with medical universities',
      route: '/dynamic/cse',
      icon: 'globe',
    },
    {
      label: 'Insights library',
      description: 'Medical admissions articles',
      route: '/dynamic/blogs',
      icon: 'bookmark',
    },
  ];

  private readonly routeSubscription: Subscription;

  constructor() {
    this.updatePageMeta(this.router.url);
    this.routeSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updatePageMeta(event.urlAfterRedirects);
        this.closeOverlays();
      });

    this.dashboardService.getSummary().subscribe({
      next: (response) => {
        this.unreadCount.set(response.data?.notifications?.unread_count ?? 0);
        this.notifications.set(response.data?.notifications?.recent ?? []);
      },
      error: () => {
        this.unreadCount.set(0);
        this.notifications.set([]);
      },
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  protected get filteredDestinations(): NavigationItem[] {
    const query = this.searchQuery().trim().toLowerCase();
    return query
      ? this.destinations.filter((item) =>
          `${item.label} ${item.description}`.toLowerCase().includes(query),
        )
      : this.destinations;
  }

  @HostListener('document:keydown', ['$event'])
  protected handleKeyboard(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.openCommand();
      return;
    }
    if (event.key === 'Escape') this.closeOverlays();
  }

  protected openCommand(): void {
    this.commandOpen.set(true);
    this.notificationOpen.set(false);
    this.profileOpen.set(false);
    window.setTimeout(() => document.querySelector<HTMLInputElement>('#workspace-search')?.focus());
  }

  protected toggleNotifications(): void {
    this.notificationOpen.update((value) => !value);
    this.commandOpen.set(false);
    this.profileOpen.set(false);
  }

  protected toggleProfile(): void {
    this.profileOpen.update((value) => !value);
    this.commandOpen.set(false);
    this.notificationOpen.set(false);
  }

  protected navigateTo(route: string): void {
    void this.router.navigateByUrl(route);
  }

  protected onLogout(): void {
    if (this.loggingOut()) return;
    this.loggingOut.set(true);
    this.authService.logout().subscribe({
      next: () => this.finishLogout(),
      error: () => this.finishLogout(),
    });
  }

  protected closeMobileNav(): void {
    this.sidebarOpen.set(false);
  }

  protected closeOverlays(): void {
    this.sidebarOpen.set(false);
    this.commandOpen.set(false);
    this.notificationOpen.set(false);
    this.profileOpen.set(false);
    this.searchQuery.set('');
  }

  protected notificationTitle(notification: any): string {
    return notification?.title ?? notification?.message ?? 'Preparation update';
  }

  protected notificationMeta(notification: any): string {
    return notification?.created_at ?? notification?.timestamp ?? 'Recently';
  }

  private finishLogout(): void {
    this.tokenService.clearTokens();
    void this.router.navigate(['/']);
  }

  private safeCurrentUser() {
    try {
      return this.tokenService.getCurrentUser();
    } catch {
      return null;
    }
  }

  private safeDisplayName(): string {
    try {
      return this.tokenService.getUserDisplayName();
    } catch {
      return 'Student';
    }
  }

  private updatePageMeta(url: string): void {
    const normalized = url.split('?')[0];
    const definitions: Array<[string, PageMeta]> = [
      ['/dynamic/neet/quick-test', { eyebrow: 'NEET preparation', title: 'Custom practice' }],
      ['/dynamic/neet/leaderboard', { eyebrow: 'Performance', title: 'Leaderboard' }],
      ['/dynamic/neet', { eyebrow: 'NEET preparation', title: 'Previous papers' }],
      ['/dynamic/ucat/previous-year', { eyebrow: 'UCAT preparation', title: 'Previous papers' }],
      ['/dynamic/ucat', { eyebrow: 'UCAT preparation', title: 'Practice workspace' }],
      [
        '/dynamic/cse/university-details',
        { eyebrow: 'University finder', title: 'University profile' },
      ],
      ['/dynamic/cse/recommendations', { eyebrow: 'University finder', title: 'Your matches' }],
      ['/dynamic/cse/student-details', { eyebrow: 'University finder', title: 'Student profile' }],
      ['/dynamic/cse/questionnaire', { eyebrow: 'University finder', title: 'Preferences' }],
      ['/dynamic/cse', { eyebrow: 'University finder', title: 'Explore destinations' }],
      ['/dynamic/blogs', { eyebrow: 'Knowledge centre', title: 'Insights' }],
      ['/dynamic/dashboard', { eyebrow: 'Student workspace', title: 'Dashboard' }],
    ];
    this.pageMeta.set(
      definitions.find(([route]) => normalized.startsWith(route))?.[1] ?? {
        eyebrow: 'Student workspace',
        title: 'Dashboard',
      },
    );
  }
}
