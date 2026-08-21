import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { InvitesService } from '../../../services/invites.service';
import { InviteActionsComponent } from '../invite-actions/invite-actions';
import { Icon, IconName } from '../../../../../../shared/ui/icon/icon';
import { ImageFallbackDirective } from '../../../../../../shared/ui/media/image-fallback.directive';
import { DeclineReason, Invite, InviteHistoryItem, InviteStatus } from '../../../models/invite.model';

const STATUS_CONFIG: Record<InviteStatus, { label: string; badgeClass: string; icon: IconName }> = {
  NEW: { label: 'New Offer', badgeClass: 'status-new', icon: 'sparkles' },
  PENDING: { label: 'Pending Response', badgeClass: 'status-new', icon: 'clock' },
  VIEWED: { label: 'Reviewed', badgeClass: 'status-viewed', icon: 'sparkles' },
  ACCEPTED: { label: 'Accepted', badgeClass: 'status-accepted', icon: 'check' },
  DECLINED: { label: 'Declined', badgeClass: 'status-declined', icon: 'close' },
  EXPIRED: { label: 'Expired', badgeClass: 'status-expired', icon: 'clock' },
  CANCELLED: { label: 'Withdrawn', badgeClass: 'status-expired', icon: 'close' },
};

@Component({
  selector: 'app-invite-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    InviteActionsComponent,
    Icon,
    ImageFallbackDirective,
    CurrencyPipe,
    DatePipe,
  ],
  templateUrl: './invite-details.component.html',
  styleUrl: './invite-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly invitesService = inject(InvitesService);

  readonly invite = signal<Invite | undefined>(undefined);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  readonly history = signal<InviteHistoryItem[]>([]);
  readonly historyLoading = signal<boolean>(false);
  readonly historyError = signal<string | null>(null);

  readonly accepting = signal<boolean>(false);
  readonly declining = signal<boolean>(false);
  readonly actionError = signal<string | null>(null);
  readonly actionSuccess = signal<string | null>(null);

  readonly statusConfig = computed(() => {
    const inv = this.invite();
    if (!inv) return null;
    return (
      STATUS_CONFIG[inv.status] ?? {
        label: inv.status,
        badgeClass: 'status-new',
        icon: 'sparkles' as IconName,
      }
    );
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const inviteId = params.get('inviteId');
      if (inviteId) {
        this.loadInviteDetails(inviteId);
      } else {
        this.loading.set(false);
        this.error.set('No invitation ID provided.');
      }
    });
  }

  loadInviteDetails(inviteId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.invitesService.getInviteById(inviteId).subscribe({
      next: (item) => {
        this.invite.set(item);
        this.loading.set(false);

        if (item && (item.status === 'PENDING' || item.status === 'NEW')) {
          this.invitesService.markInviteAsViewed(item.id).subscribe({
            next: (updated) => {
              if (updated) {
                this.invite.set(updated);
              }
            },
            error: () => {},
          });
        }

        this.loadInviteHistory(inviteId);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || err?.message || 'Failed to load invitation details');
      },
    });
  }

  loadInviteHistory(inviteId: string): void {
    this.historyLoading.set(true);
    this.historyError.set(null);

    this.invitesService.getInviteHistory(inviteId).subscribe({
      next: (items) => {
        this.history.set(items);
        this.historyLoading.set(false);
      },
      error: (err) => {
        this.historyLoading.set(false);
        this.historyError.set(
          err?.error?.message ||
          (err?.status === 404
            ? 'Invitation activity history not found.'
            : 'Failed to load invitation activity.')
        );
      },
    });
  }

  onAcceptInvite(): void {
    const current = this.invite();
    if (!current || this.accepting() || this.declining()) return;

    this.accepting.set(true);
    this.actionError.set(null);
    this.actionSuccess.set(null);

    this.invitesService.acceptInvite(current.id).subscribe({
      next: (updated) => {
        this.accepting.set(false);
        this.actionSuccess.set('You have successfully accepted the university invitation!');
        if (updated) {
          this.invite.set(updated);
        } else {
          this.invite.update((inv) =>
            inv ? { ...inv, status: 'ACCEPTED', respondedAt: new Date().toISOString() } : inv
          );
        }
        this.loadInviteHistory(current.id);
      },
      error: (err) => {
        this.accepting.set(false);
        const errorMsg =
          err?.error?.message ||
          (err?.status === 409
            ? 'Unable to accept this invitation: the offer is no longer in an acceptable state.'
            : err?.status === 404
            ? 'Invitation not found.'
            : err?.status === 403
            ? 'You are not authorized to accept this invitation.'
            : 'Failed to accept invitation. Please try again.');
        this.actionError.set(errorMsg);
      },
    });
  }

  onDeclineInvite(payload: { reason: DeclineReason; note: string }): void {
    const current = this.invite();
    if (!current || this.declining() || this.accepting()) return;

    this.declining.set(true);
    this.actionError.set(null);
    this.actionSuccess.set(null);

    this.invitesService.declineInvite(current.id, payload).subscribe({
      next: (updated) => {
        this.declining.set(false);
        this.actionSuccess.set('You have declined this university invitation.');
        if (updated) {
          this.invite.set(updated);
        } else {
          this.invite.update((inv) =>
            inv
              ? {
                  ...inv,
                  status: 'DECLINED',
                  declineReason: payload.reason,
                  declineNote: payload.note,
                  respondedAt: new Date().toISOString(),
                }
              : inv
          );
        }
        this.loadInviteHistory(current.id);
      },
      error: (err) => {
        this.declining.set(false);
        const errorMsg =
          err?.error?.message ||
          (err?.status === 409
            ? 'Unable to decline this invitation: the offer is no longer in a valid state.'
            : err?.status === 404
            ? 'Invitation not found.'
            : err?.status === 403
            ? 'You are not authorized to decline this invitation.'
            : 'Failed to decline invitation. Please try again.');
        this.actionError.set(errorMsg);
      },
    });
  }
}
