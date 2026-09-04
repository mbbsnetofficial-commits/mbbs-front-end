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
import { AuthService } from '../../students/auth/services/auth.service';
import { TokenService } from '../../students/auth/services/token.service';

import { QuickTest } from '../../students/dynamic/neet/components/quick-test/quick-test';
import { NeetModalService } from '../../students/dynamic/neet/services/neet-modal.service';
import { UcatQuickTest } from '../../students/dynamic/ucat/components/quick-test/quick-test';
import { UcatModalService } from '../../students/dynamic/ucat/services/ucat-modal.service';
import { GamsatQuickTest } from '../../students/dynamic/gamsat/components/quick-test/quick-test';
import { GamsatModalService } from '../../students/dynamic/gamsat/services/gamsat-modal.service';
import { StudentNotificationsService } from '../../students/notifications/services/student-notifications.service';
import { StudentNotification } from '../../students/notifications/models/student-notification.model';

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
  imports: [Icon, RouterLink, RouterLinkActive, RouterOutlet, QuickTest, UcatQuickTest, GamsatQuickTest],
  templateUrl: './dynamic-layouts.html',
  styleUrl: './dynamic-layouts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicLayouts implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly notificationsService = inject(StudentNotificationsService);
  protected readonly router = inject(Router);

  protected readonly sidebarOpen = signal(false);
  protected readonly loggingOut = signal(false);
  protected readonly commandOpen = signal(false);
  protected readonly notificationOpen = signal(false);
  protected readonly profileOpen = signal(false);
  protected readonly quickTestModalOpen = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly pageMeta = signal<PageMeta>({
    eyebrow: 'Student workspace',
    title: 'Dashboard',
  });
  protected readonly unreadCount = this.notificationsService.unreadCount;
  protected readonly notifications = this.notificationsService.notifications;
  protected readonly loadingNotifications = this.notificationsService.loading;

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
      icon: 'plus',
    },
    {
      label: 'Previous UCAT papers',
      description: 'Past-paper test environment',
      route: '/dynamic/ucat/previous-year',
      icon: 'history',
    },
    {
      label: 'GAMSAT practice',
      description: 'Create a GAMSAT practice session',
      route: '/dynamic/gamsat',
      icon: 'microscope',
    },
    {
      label: 'Previous GAMSAT papers',
      description: 'Past-paper test environment',
      route: '/dynamic/gamsat',
      icon: 'history',
    },
    {
      label: 'University invites',
      description: 'Review university invitations and offers',
      route: '/dynamic/invites',
      icon: 'heart',
    },
    {
      label: 'Student profile',
      description: 'Academic background and MBBS preferences',
      route: '/dynamic/profile',
      icon: 'profile',
    },
    {
      label: 'Insights library',
      description: 'Medical admissions articles',
      route: '/blogs',
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
    this.loadUnreadCount();
  }

  private loadUnreadCount(): void {
    if (this.tokenService.getAccessToken()) {
      this.notificationsService.getUnreadCount().subscribe({
        error: () => {},
      });
    }
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
    if (this.notificationOpen()) {
      this.notificationsService.getNotifications({ limit: 20 }).subscribe({
        error: () => {},
      });
    }
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

  protected readonly neetModalService = inject(NeetModalService);
  protected readonly ucatModalService = inject(UcatModalService);
  protected readonly gamsatModalService = inject(GamsatModalService);

  protected triggerBuildTestModal(event?: MouseEvent): void {
    if (event) event.preventDefault();
    this.neetModalService.openBuildTestModal();
  }

  protected closeQuickTestModal(): void {
    this.neetModalService.closeBuildTestModal();
  }

  protected onTestSaved(payload: any): void {
    this.neetModalService.saveTest(payload);
  }

  protected triggerUcatBuildTestModal(event?: MouseEvent): void {
    if (event) event.preventDefault();
    this.ucatModalService.openBuildTestModal();
  }

  protected closeUcatQuickTestModal(): void {
    this.ucatModalService.closeBuildTestModal();
  }

  protected onUcatTestSaved(payload: any): void {
    this.ucatModalService.saveTest(payload);
  }

  protected triggerGamsatBuildTestModal(event?: MouseEvent): void {
    if (event) event.preventDefault();
    this.gamsatModalService.openBuildTestModal();
  }

  protected closeGamsatQuickTestModal(): void {
    this.gamsatModalService.closeBuildTestModal();
  }

  protected onGamsatTestSaved(payload: any): void {
    this.gamsatModalService.saveTest(payload);
  }

  protected closeOverlays(): void {
    this.sidebarOpen.set(false);
    this.commandOpen.set(false);
    this.notificationOpen.set(false);
    this.profileOpen.set(false);
    this.quickTestModalOpen.set(false);
    this.searchQuery.set('');
  }

  protected onNotificationClick(notification: StudentNotification): void {
    if (!notification.is_read) {
      this.notificationsService.markAsRead(notification._id).subscribe({
        error: () => {},
      });
    }
    if (notification.action_url) {
      this.closeOverlays();
      if (
        notification.action_url.startsWith('http://') ||
        notification.action_url.startsWith('https://')
      ) {
        window.open(notification.action_url, '_blank');
      } else {
        void this.router.navigateByUrl(notification.action_url);
      }
    }
  }

  protected onMarkAllAsRead(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.notificationsService.markAllAsRead().subscribe({
      error: () => {},
    });
  }

  protected onDismissNotification(event: MouseEvent, notificationId: string): void {
    event.stopPropagation();
    this.notificationsService.deleteNotification(notificationId).subscribe({
      error: () => {},
    });
  }

  protected notificationIcon(type?: string): IconName {
    switch (type) {
      case 'test':
        return 'sparkles';
      case 'reminder':
        return 'clock';
      case 'chatbot':
        return 'chat';
      case 'account':
        return 'profile';
      default:
        return 'bell';
    }
  }

  protected notificationTitle(notification: StudentNotification): string {
    return notification?.title || 'Notification';
  }

  protected notificationMeta(notification: StudentNotification): string {
    if (!notification?.created_at) return 'Recently';
    try {
      const date = new Date(notification.created_at);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
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
      ['/dynamic/neet', { eyebrow: 'NEET preparation', title: 'Learning Report' }],
      ['/dynamic/ucat/previous-year', { eyebrow: 'UCAT preparation', title: 'Previous papers' }],
      ['/dynamic/ucat', { eyebrow: 'UCAT preparation', title: 'Practice workspace' }],
      ['/dynamic/gamsat/previous-year', { eyebrow: 'GAMSAT preparation', title: 'Previous papers' }],
      ['/dynamic/gamsat/quick-test', { eyebrow: 'GAMSAT preparation', title: 'Custom practice' }],
      ['/dynamic/gamsat/practice', { eyebrow: 'GAMSAT preparation', title: 'Practice workspace' }],
      ['/dynamic/gamsat', { eyebrow: 'GAMSAT preparation', title: 'Learning Report' }],
      ['/dynamic/invites', { eyebrow: 'Admissions', title: 'University Invitations' }],
      ['/dynamic/profile', { eyebrow: 'Student Space', title: 'Student Profile & Preferences' }],
      ['/blogs', { eyebrow: 'Knowledge centre', title: 'Insights' }],
      ['/dynamic/ai-chat', { eyebrow: 'AI Assistant', title: 'Knowledge Base' }],
    ];
    this.pageMeta.set(
      definitions.find(([route]) => normalized.startsWith(route))?.[1] ?? {
        eyebrow: 'Student workspace',
        title: 'Workspace',
      },
    );
  }
}
