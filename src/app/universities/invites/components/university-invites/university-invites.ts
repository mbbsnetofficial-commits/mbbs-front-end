import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { Icon } from '../../../../shared/ui/icon/icon';
import {
  OrganizationInviteItem,
  OrganizationInvitesFilters,
} from '../../models/university-invites.model';
import { UniversityInvitesService } from '../../services/university-invites.service';

@Component({
  selector: 'app-university-invites',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, Icon],
  templateUrl: './university-invites.html',
  styleUrl: './university-invites.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UniversityInvitesComponent implements OnInit {
  private readonly invitesService = inject(UniversityInvitesService);

  readonly invitations = this.invitesService.invitations;
  readonly pagination = this.invitesService.pagination;
  readonly loading = this.invitesService.loading;
  readonly error = this.invitesService.error;
  readonly cancelling = this.invitesService.cancelling;

  readonly currentStatus = signal<string>('ALL');
  readonly searchQuery = signal<string>('');
  readonly currentPage = signal<number>(1);

  // Cancellation modal state (API #7)
  readonly selectedInviteToCancel = signal<OrganizationInviteItem | null>(null);
  readonly cancelErrorMessage = signal<string | null>(null);
  readonly cancelSuccessMessage = signal<string | null>(null);

  private readonly searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((query) => {
        this.searchQuery.set(query);
        this.loadInvitations(1);
      });

    this.loadInvitations(1);
  }

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  filterByStatus(status: string): void {
    this.currentStatus.set(status);
    this.loadInvitations(1);
  }

  loadInvitations(page = 1): void {
    this.currentPage.set(page);

    const filters: OrganizationInvitesFilters = {
      page,
      limit: 20,
      status: this.currentStatus() !== 'ALL' ? this.currentStatus() : undefined,
      search: this.searchQuery().trim() || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    this.invitesService.getInvitations(filters).subscribe({
      error: () => {
        // Error state handled by signal
      },
    });
  }

  goToPage(page: number): void {
    const pag = this.pagination();
    if (!pag || page < 1 || page > pag.totalPages || this.loading()) return;
    this.loadInvitations(page);
  }

  retry(): void {
    this.loadInvitations(this.currentPage());
  }

  promptCancel(invite: OrganizationInviteItem): void {
    if (invite.status.toUpperCase() !== 'PENDING') return;
    this.cancelErrorMessage.set(null);
    this.selectedInviteToCancel.set(invite);
  }

  closeCancelModal(): void {
    if (this.cancelling()) return;
    this.selectedInviteToCancel.set(null);
    this.cancelErrorMessage.set(null);
  }

  confirmCancel(): void {
    const invite = this.selectedInviteToCancel();
    if (!invite || this.cancelling()) return;

    this.cancelErrorMessage.set(null);

    this.invitesService.cancelInvitation(invite._id).subscribe({
      next: (res) => {
        if (res?.success) {
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
        const msg =
          err?.error?.message ||
          err?.error?.error ||
          err?.message ||
          'Failed to cancel invitation. Please try again.';
        this.cancelErrorMessage.set(msg);
      },
    });
  }
}
