import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DeclineReason, Invite } from '../../../models/invite.model';
import { Icon } from '../../../../../shared/ui/icon/icon';

@Component({
  selector: 'app-invite-actions',
  standalone: true,
  imports: [RouterLink, Icon, FormsModule],
  templateUrl: './invite-actions.html',
  styleUrl: './invite-actions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteActionsComponent {
  readonly invite = input.required<Invite>();
  readonly accepting = input<boolean>(false);
  readonly declining = input<boolean>(false);

  readonly acceptClicked = output<void>();
  readonly declineSubmitted = output<{ reason: DeclineReason; note: string }>();

  readonly showAcceptModal = signal(false);
  readonly showDeclineModal = signal(false);

  selectedReason: DeclineReason = 'NOT_INTERESTED';
  declineNote: string = '';

  readonly declineReasons: Array<{ key: DeclineReason; label: string }> = [
    { key: 'TUITION', label: 'Tuition / Budget Constraints' },
    { key: 'COUNTRY', label: 'Country Preference Does Not Align' },
    { key: 'UNIVERSITY', label: 'Preferring a Different University' },
    { key: 'INTAKE', label: 'Timing / Intake Cohort Conflict' },
    { key: 'NOT_INTERESTED', label: 'Not Interested at This Time' },
    { key: 'OTHER', label: 'Other Consideration' },
  ];

  openAcceptModal(): void {
    if (this.accepting() || this.declining()) return;
    this.showAcceptModal.set(true);
  }

  closeAcceptModal(): void {
    this.showAcceptModal.set(false);
  }

  confirmAccept(): void {
    if (this.accepting() || this.declining()) return;
    this.showAcceptModal.set(false);
    this.acceptClicked.emit();
  }

  openDeclineModal(): void {
    if (this.accepting() || this.declining()) return;
    this.showDeclineModal.set(true);
  }

  closeDeclineModal(): void {
    this.showDeclineModal.set(false);
  }

  confirmDecline(): void {
    if (this.accepting() || this.declining()) return;
    this.showDeclineModal.set(false);
    this.declineSubmitted.emit({
      reason: this.selectedReason,
      note: this.declineNote.trim(),
    });
  }
}
