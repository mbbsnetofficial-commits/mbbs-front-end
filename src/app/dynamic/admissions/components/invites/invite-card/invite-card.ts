import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Invite, InviteStatus } from '../../../models/invite.model';
import { Icon, IconName } from '../../../../../shared/ui/icon/icon';
import { ImageFallbackDirective } from '../../../../../shared/ui/media/image-fallback.directive';

const STATUS_CONFIG: Record<InviteStatus, { label: string; badgeClass: string; icon: IconName }> = {
  NEW: { label: 'New Offer', badgeClass: 'status-new', icon: 'sparkles' },
  PENDING: { label: 'Pending Response', badgeClass: 'status-new', icon: 'clock' },
  VIEWED: { label: 'Under Review', badgeClass: 'status-viewed', icon: 'sparkles' },
  ACCEPTED: { label: 'Accepted', badgeClass: 'status-accepted', icon: 'check' },
  DECLINED: { label: 'Declined', badgeClass: 'status-declined', icon: 'close' },
  EXPIRED: { label: 'Expired', badgeClass: 'status-expired', icon: 'clock' },
  CANCELLED: { label: 'Withdrawn', badgeClass: 'status-expired', icon: 'close' },
};

@Component({
  selector: 'app-invite-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    Icon,
    ImageFallbackDirective,
    CurrencyPipe,
    DatePipe,
  ],
  templateUrl: './invite-card.html',
  styleUrl: './invite-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteCard {
  readonly invite = input.required<Invite>();

  readonly statusConfig = computed(() => {
    return (
      STATUS_CONFIG[this.invite().status] ?? {
        label: this.invite().status,
        badgeClass: 'status-new',
        icon: 'sparkles' as IconName,
      }
    );
  });

  isActionable(): boolean {
    const s = this.invite().status;
    return s === 'PENDING' || s === 'NEW' || s === 'VIEWED';
  }
}
