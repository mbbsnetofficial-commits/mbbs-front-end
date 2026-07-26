import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  signal,
  viewChild
} from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import { Icon } from '../../shared/ui/icon/icon';
import { AuthService } from '../../core/serivce/auth.service';
import { TokenService } from '../../core/serivce/token.service';

@Component({
  selector: 'app-dynamic-layouts',
  standalone: true,
  imports: [Icon, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './dynamic-layouts.html',
  styleUrl: './dynamic-layouts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicLayouts {
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('dashboardSearch');

  protected readonly sidebarOpen = signal(false);
  protected readonly sidebarCollapsed = signal(false);
  protected readonly neetOpen = signal(true);
  protected readonly profileOpen = signal(false);
  protected readonly notificationsOpen = signal(false);
  protected readonly themePreview = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly loggingOut = signal(false);
  protected readonly userName: string;
  protected readonly userInitial = computed(() => this.userName.charAt(0).toUpperCase());

  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly router: Router
  ) {
    this.userName = this.tokenService.getUserDisplayName();
  }

  @HostListener('document:keydown', ['$event'])
  protected handleKeyboard(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.profileOpen.set(false);
      this.notificationsOpen.set(false);
      this.sidebarOpen.set(false);
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k') {
      event.preventDefault();
      this.searchInput()?.nativeElement.focus();
    }
  }

  protected onLogout(): void {
    if (this.loggingOut()) {
      return;
    }

    this.loggingOut.set(true);
    this.authService.logout().subscribe({
      next: () => this.finishLogout(),
      error: () => this.finishLogout()
    });
  }

  protected closeMobileNav(): void {
    this.sidebarOpen.set(false);
  }

  protected toggleProfile(): void {
    this.notificationsOpen.set(false);
    this.profileOpen.update((open) => !open);
  }

  protected toggleNotifications(): void {
    this.profileOpen.set(false);
    this.notificationsOpen.update((open) => !open);
  }

  protected submitSearch(event: Event): void {
    event.preventDefault();
    const query = this.searchQuery().trim();
    this.router.navigate(['/dynamic/dashboard'], {
      queryParams: query ? { q: query } : {},
      fragment: 'latest'
    });
  }

  private finishLogout(): void {
    this.tokenService.clearTokens();
    this.router.navigate(['/']);
  }
}
