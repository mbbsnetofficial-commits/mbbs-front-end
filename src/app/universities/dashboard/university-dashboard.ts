import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Icon } from '../../shared/ui/icon/icon';
import { UniversityHeaderComponent } from '../shared/components/university-header/university-header';
import { UniversityAuthService } from '../auth/services/university-auth.service';
import { UniversityInvitesService } from '../invites/services/university-invites.service';
import { UniversityNotificationsService } from '../notifications/services/university-notifications.service';
import { RecentInvite } from './models/university-dashboard.model';
import { UniversityDashboardService } from './services/university-dashboard.service';

@Component({
  selector: 'app-university-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, Icon, UniversityHeaderComponent],
  templateUrl: './university-dashboard.html',
  styleUrl: './university-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UniversityDashboardComponent implements OnInit {
  private readonly authService = inject(UniversityAuthService);
  private readonly dashboardService = inject(UniversityDashboardService);
  private readonly invitesService = inject(UniversityInvitesService);
  private readonly notificationsService = inject(UniversityNotificationsService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;
  readonly logoutLoading = this.authService.logoutLoading;

  readonly summary = this.dashboardService.summary;
  readonly unreadCount = this.notificationsService.unreadCount;
  readonly loading = this.dashboardService.loading;
  readonly error = this.dashboardService.error;

  // Cancel invitation state
  readonly selectedInviteToCancel = signal<RecentInvite | null>(null);
  readonly cancellingInvite = this.invitesService.cancelling;
  readonly cancelErrorMessage = signal<string | null>(null);
  readonly cancelSuccessMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadSummary();
    this.loadUnreadCount();
  }

  loadUnreadCount(): void {
    this.notificationsService.getUnreadCount().subscribe({
      error: () => {
        // Handled silently
      },
    });
  }

  loadSummary(): void {
    this.dashboardService.loadSummary().subscribe({
      error: () => {
        // Error state handled by dashboardService.error signal
      },
    });
  }

  retry(): void {
    this.loadSummary();
  }

  promptCancelInvite(invite: RecentInvite): void {
    if (invite.status.toUpperCase() !== 'PENDING') return;
    this.cancelErrorMessage.set(null);
    this.selectedInviteToCancel.set(invite);
  }

  closeCancelModal(): void {
    if (this.cancellingInvite()) return;
    this.selectedInviteToCancel.set(null);
    this.cancelErrorMessage.set(null);
  }

  confirmCancelInvite(): void {
    const invite = this.selectedInviteToCancel();
    if (!invite || this.cancellingInvite()) return;

    this.cancelErrorMessage.set(null);

    this.invitesService.cancelInvitation(invite._id).subscribe({
      next: (res) => {
        if (res?.success) {
          const current = this.dashboardService.summary();
          if (current) {
            const updatedInvites = current.recentInvites.map((inv) =>
              inv._id === invite._id ? { ...inv, status: 'CANCELLED' } : inv
            );
            const pendingCount = Math.max(0, current.pendingInvites - 1);
            this.dashboardService.summary.set({
              ...current,
              pendingInvites: pendingCount,
              recentInvites: updatedInvites,
            });
          }

          this.cancelSuccessMessage.set(
            `Invitation to ${invite.studentId} was cancelled successfully.`
          );
          this.selectedInviteToCancel.set(null);

          setTimeout(() => {
            this.cancelSuccessMessage.set(null);
          }, 4000);
        }
      },
      error: (err) => {
        const errorMsg =
          err?.error?.message ||
          err?.error?.error ||
          err?.message ||
          'Failed to cancel invitation. Please try again.';
        this.cancelErrorMessage.set(errorMsg);
      },
    });
  }

  logout(): void {
    if (this.logoutLoading()) return;

    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/university/auth/login']);
      },
      error: () => {
        this.router.navigate(['/university/auth/login']);
      },
    });
  }
}
