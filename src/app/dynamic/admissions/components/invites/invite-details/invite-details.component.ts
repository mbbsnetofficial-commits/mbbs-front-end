import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { InvitesService } from '../../../services/invites.service';
import { InviteActionsComponent } from '../invite-actions/invite-actions';
import { Icon, IconName } from '../../../../../shared/ui/icon/icon';
import { ImageFallbackDirective } from '../../../../../shared/ui/media/image-fallback.directive';
import { DeclineReason, Invite, InviteStatus } from '../../../models/invite.model';

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
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || err?.message || 'Failed to load invitation details');
      },
    });
  }

  onAcceptInvite(): void {
    const current = this.invite();
    if (!current) return;
  }

  onDeclineInvite(_payload: { reason: DeclineReason; note: string }): void {
    const current = this.invite();
    if (!current) return;
  }
}
