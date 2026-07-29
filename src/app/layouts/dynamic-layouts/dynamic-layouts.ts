import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  signal
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
  protected readonly sidebarOpen = signal(false);
  protected readonly sidebarCollapsed = signal(false);
  protected readonly neetOpen = signal(true);
  protected readonly loggingOut = signal(false);

  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly router: Router
  ) {}

  @HostListener('document:keydown', ['$event'])
  protected handleKeyboard(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.sidebarOpen.set(false);
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

  private finishLogout(): void {
    this.tokenService.clearTokens();
    this.router.navigate(['/']);
  }
}
