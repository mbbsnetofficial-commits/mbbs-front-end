import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { InvitesService } from '../../../services/invites.service';
import { StudentProfileService } from '../../../services/student-profile.service';
import { InviteCard } from '../invite-card/invite-card';
import { Icon } from '../../../../../../shared/ui/icon/icon';
import { Invite } from '../../../models/invite.model';

@Component({
  selector: 'app-student-invites',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    InviteCard,
    Icon,
    CurrencyPipe,
  ],
  templateUrl: './student-invites.component.html',
  styleUrl: './student-invites.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentInvitesComponent {
  private readonly invitesService = inject(InvitesService);
  private readonly profileService = inject(StudentProfileService);

  readonly allInvites = this.invitesService.invites;
  readonly summary = this.invitesService.summary;
  readonly loading = this.invitesService.loading;
  readonly error = this.invitesService.error;
  readonly profile = this.profileService.profile;

  readonly activeFilter = signal<string>('ALL');
  readonly searchQuery = signal<string>('');
  readonly sortOption = signal<string>('MATCH');

  readonly filterTabs = [
    { key: 'ALL', label: 'All Opportunities' },
    { key: 'PENDING', label: 'Pending Response' },
    { key: 'VIEWED', label: 'Reviewed' },
    { key: 'ACCEPTED', label: 'Accepted' },
    { key: 'DECLINED', label: 'Declined' },
  ];

  readonly avgScholarship = computed(() => {
    const list = this.allInvites().filter((i) => (i.financial?.scholarshipAmount || 0) > 0);
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, curr) => acc + (curr.financial?.scholarshipAmount || 0), 0);
    return Math.round(sum / list.length);
  });

  readonly filteredInvites = computed<Invite[]>(() => {
    let list = this.allInvites();
    const f = this.activeFilter();
    if (f !== 'ALL') {
      list = list.filter(
        (item) =>
          item.status === f ||
          (f === 'PENDING' && (item.status as string) === 'NEW') ||
          (f === 'NEW' && (item.status as string) === 'PENDING')
      );
    }

    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(
        (item) =>
          (item.university?.name || '').toLowerCase().includes(q) ||
          (item.university?.country || '').toLowerCase().includes(q) ||
          (item.university?.city || '').toLowerCase().includes(q) ||
          (item.program?.programName || item.title || '').toLowerCase().includes(q) ||
          (item.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }

    const sort = this.sortOption();
    return [...list].sort((a, b) => {
      if (sort === 'MATCH') {
        return (b.eligibility?.matchPercentage || 0) - (a.eligibility?.matchPercentage || 0);
      }
      if (sort === 'NEWEST') {
        return (
          new Date(b.issuedAt || b.createdAt || 0).getTime() -
          new Date(a.issuedAt || a.createdAt || 0).getTime()
        );
      }
      if (sort === 'EXPIRY') {
        return new Date(a.expiresAt || 0).getTime() - new Date(b.expiresAt || 0).getTime();
      }
      if (sort === 'FEE_LOW') {
        return (a.financial?.netTuitionAnnual || 0) - (b.financial?.netTuitionAnnual || 0);
      }
      if (sort === 'SCHOLARSHIP') {
        return (b.financial?.scholarshipAmount || 0) - (a.financial?.scholarshipAmount || 0);
      }
      return 0;
    });
  });

  onFilterSelected(filter: string): void {
    this.activeFilter.set(filter);
  }

  onSearchChanged(query: string): void {
    this.searchQuery.set(query);
  }

  onSortChanged(sort: string): void {
    this.sortOption.set(sort);
  }

  retry(): void {
    this.invitesService.loadInvites().subscribe({ error: () => {} });
  }
}
