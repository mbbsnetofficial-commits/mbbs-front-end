import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../../../../shared/ui/icon/icon';
import { UniversityAuthService } from '../../../auth/services/university-auth.service';
import { UniversityNotificationsService } from '../../../notifications/services/university-notifications.service';

@Component({
  selector: 'app-university-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, Icon],
  templateUrl: './university-header.html',
  styleUrl: './university-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UniversityHeaderComponent {
  private readonly authService = inject(UniversityAuthService, {
    optional: true,
  });
  private readonly notificationsService = inject(
    UniversityNotificationsService,
    { optional: true }
  );
  private readonly router = inject(Router, { optional: true });

  readonly currentUser = computed(() => {
    if (typeof this.authService?.currentUser === 'function') {
      return this.authService.currentUser();
    }
    return null;
  });

  readonly logoutLoading = computed(() => {
    if (typeof this.authService?.logoutLoading === 'function') {
      return this.authService.logoutLoading();
    }
    return false;
  });

  readonly unreadCount = computed(() => {
    if (typeof this.notificationsService?.unreadCount === 'function') {
      return this.notificationsService.unreadCount();
    }
    return 0;
  });

  logout(): void {
    if (this.authService) {
      this.authService.logout().subscribe({
        next: () => {
          this.router?.navigate(['/university/auth/login']);
        },
        error: () => {
          this.router?.navigate(['/university/auth/login']);
        },
      });
    } else {
      this.router?.navigate(['/university/auth/login']);
    }
  }
}
