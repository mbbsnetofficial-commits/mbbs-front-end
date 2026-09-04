import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Invite, InviteStatus } from '../../../models/invite.model';
import { Icon, IconName } from '../../../../../../shared/ui/icon/icon';
import { ImageFallbackDirective } from '../../../../../../shared/ui/media/image-fallback.directive';

const STATUS_CONFIG: Record<InviteStatus, { label: string; badgeClass: string; icon: IconName }> = {
  NEW: { label: 'New Offer', badgeClass: 'status-new', icon: 'sparkles' },
  PENDING: { label: 'Action Needed', badgeClass: 'status-new', icon: 'clock' },
  VIEWED: { label: 'Under Review', badgeClass: 'status-viewed', icon: 'sparkles' },
  ACCEPTED: { label: 'Offer Accepted', badgeClass: 'status-accepted', icon: 'check' },
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
  readonly logoFailed = signal<boolean>(false);

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

  onLogoError(): void {
    this.logoFailed.set(true);
  }

  getInitials(name?: string): string {
    if (!name) return 'MED';
    const clean = name.replace(/[-–—/()]/g, ' ');
    const words = clean.split(/\s+/).filter((w) => w.length > 0);

    // Look for uppercase acronym (e.g. SEU, MSU, TSMU)
    const acronym = words.find(
      (w) => w.length >= 2 && w.length <= 5 && w === w.toUpperCase() && !/^\d+$/.test(w)
    );
    if (acronym) return acronym;

    if (words.length === 1) {
      return words[0].slice(0, 3).toUpperCase();
    }
    const filtered = words.filter(
      (w) => !['OF', 'AND', 'FOR', 'THE', 'IN', 'AT', 'TO'].includes(w.toUpperCase())
    );
    const initials = filtered
      .map((w) => w[0].toUpperCase())
      .slice(0, 3)
      .join('');
    return initials || name.slice(0, 3).toUpperCase();
  }
}
