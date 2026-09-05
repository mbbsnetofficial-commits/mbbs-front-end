import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { InvitesService } from '../../../services/invites.service';
import { InviteActionsComponent } from '../invite-actions/invite-actions';
import { Icon, IconName } from '../../../../../../shared/ui/icon/icon';
import { ImageFallbackDirective } from '../../../../../../shared/ui/media/image-fallback.directive';
import { DeclineReason, Invite, InviteHistoryItem, InviteStatus } from '../../../models/invite.model';
import { StudentProfileService } from '../../../services/student-profile.service';

const STATUS_CONFIG: Record<InviteStatus, { label: string; badgeClass: string; icon: IconName }> = {
  NEW: { label: 'New Offer', badgeClass: 'status-new', icon: 'sparkles' },
  PENDING: { label: 'Under Review', badgeClass: 'status-under-review', icon: 'clock' },
  VIEWED: { label: 'Under Review', badgeClass: 'status-under-review', icon: 'sparkles' },
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
  private readonly profileService = inject(StudentProfileService);

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

  readonly activeTab = signal<string>('overview');

  readonly navTabs = [
    { id: 'overview', label: 'Overview', icon: 'graduation-cap' as IconName },
    { id: 'program', label: 'Program Details', icon: 'categories' as IconName },
    { id: 'financial', label: 'Financial Information', icon: 'chart' as IconName },
    { id: 'eligibility', label: 'Eligibility & Match', icon: 'check' as IconName },
    { id: 'history', label: 'Activity History', icon: 'history' as IconName },
  ];

  readonly studentName = computed(() => {
    return this.profileService.profile()?.personal?.fullName || 'Candidate';
  });

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

  readonly heroBgUrl = computed(() => {
    const inv = this.invite();
    if (!inv) return '';
    return inv.university.coverImageUrl || inv.university.logoUrl || '';
  });

  readonly univLogoUrl = computed(() => {
    const inv = this.invite();
    if (!inv) return '';
    if (inv.university?.logoUrl) {
      return inv.university.logoUrl;
    }
    const name = (inv.university?.name || '').toLowerCase();
    if (name.includes('tbilisi') || name.includes('tsmu')) {
      return '/images/mbbs-icon.png';
    }
    if (name.includes('msu') || name.includes('management and science')) {
      return '/images/universities/msu-logo.png';
    }
    if (name.includes('charles')) return '/images/universities/charles.svg';
    if (name.includes('comenius')) return '/images/universities/comenius.png';
    if (name.includes('jessenius')) return '/images/universities/jessenius.png';
    if (name.includes('lithuanian') || name.includes('lsmu')) return '/images/universities/lsmu.svg';
    if (name.includes('nicosia')) return '/images/universities/nicosia.svg';
    if (name.includes('palack')) return '/images/universities/palacky.svg';
    if (name.includes('pecs') || name.includes('pécs')) return '/images/universities/pecs.svg';
    if (name.includes('riga') || name.includes('stradins')) return '/images/universities/riga-stradins.svg';
    if (name.includes('semmelweis')) return '/images/universities/semmelweis.svg';
    return '/images/universities/msu-logo.png';
  });

  readonly logoFailed = signal<boolean>(false);
  readonly heroBgFailed = signal<boolean>(false);

  selectTab(tabId: string): void {
    this.activeTab.set(tabId);
  }

  onLogoError(): void {
    this.logoFailed.set(true);
  }

  onHeroBgError(): void {
    this.heroBgFailed.set(true);
  }

  getUniversityInitials(name?: string): string {
    if (!name) return 'MED';
    const clean = name.replace(/[-–—/()]/g, ' ');
    const words = clean.split(/\s+/).filter((w) => w.length > 0);
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

  getHistoryStepDescription(entry: InviteHistoryItem): string {
    if (entry.description && entry.description.trim()) {
      return entry.description;
    }
    const act = (entry.action || entry.title || '').toUpperCase();
    if (act.includes('ACCEPT')) {
      return 'You confirmed acceptance of this official offer. Your profile has been queued for admissions onboarding.';
    }
    if (act.includes('VIEW') || act.includes('REVIEW')) {
      return 'Invitation details, curriculum structure, and scholarship eligibility were accessed and reviewed.';
    }
    if (act.includes('ISSUE') || act.includes('CREATE')) {
      return 'University issued the official admission offer based on your academic scorecard.';
    }
    if (act.includes('DECLINE')) {
      return 'Invitation declined by candidate. Record marked as closed in admissions ledger.';
    }
    if (act.includes('EXPIRE')) {
      return 'The deadline for responding to this offer has passed.';
    }
    return 'Status updated in admissions activity record.';
  }

  getHistoryStepActor(entry: InviteHistoryItem): string {
    const act = (entry.action || entry.title || '').toUpperCase();
    if (act.includes('ACCEPT') || act.includes('DECLINE') || act.includes('VIEW') || act.includes('REVIEW')) {
      return 'Candidate Action';
    }
    if (act.includes('ISSUE') || act.includes('CREATE')) {
      return 'University Admissions';
    }
    const raw = entry.actor || '';
    if (raw && raw !== 'SYSTEM') return raw;
    return 'Admissions Portal';
  }

  getHistoryDotClass(entry: InviteHistoryItem): string {
    const act = (entry.action || entry.title || '').toUpperCase();
    if (act.includes('ACCEPT')) return 'bullet-dot-emerald';
    if (act.includes('DECLINE')) return 'bullet-dot-rose';
    if (act.includes('VIEW') || act.includes('REVIEW')) return 'bullet-dot-blue';
    if (act.includes('ISSUE') || act.includes('CREATE')) return 'bullet-dot-sky';
    return 'bullet-dot-blue';
  }

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
    this.logoFailed.set(false);
    this.heroBgFailed.set(false);

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
