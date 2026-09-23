import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Icon } from '../../../../shared/ui/icon/icon';

export interface DeletionReasonOption {
  key: string;
  label: string;
}

export interface DeletionFaq {
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-delete-account',
  standalone: true,
  imports: [RouterLink, Icon, FormsModule],
  templateUrl: './delete-account.html',
  styleUrl: './delete-account.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteAccountComponent {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  readonly version = '2.1';
  readonly effectiveDate = 'September 2026';

  // Form State
  readonly accountIdentifier = signal<string>('');
  readonly selectedReason = signal<string>('COMPLETED_EXAM');
  readonly additionalNotes = signal<string>('');
  readonly confirmUnderstood = signal<boolean>(false);

  readonly isSubmitting = signal<boolean>(false);
  readonly submissionSuccess = signal<boolean>(false);
  readonly referenceId = signal<string>('');
  readonly submissionError = signal<string | null>(null);

  readonly reasons: DeletionReasonOption[] = [
    { key: 'COMPLETED_EXAM', label: 'I have finished my entrance exams & secured admission' },
    { key: 'CHANGE_CAREER', label: 'I am no longer pursuing a medical career' },
    { key: 'PRIVACY_CONCERN', label: 'Privacy or personal data preference' },
    { key: 'DUPLICATE_ACCOUNT', label: 'I created a duplicate or accidental account' },
    { key: 'APP_NOT_NEEDED', label: 'I am using alternative preparation materials' },
    { key: 'OTHER', label: 'Other consideration' },
  ];

  readonly faqs = signal<DeletionFaq[]>([
    {
      question: 'How long does the account deletion process take?',
      answer:
        'Upon receiving your request, your account is immediately deactivated and unlisted from university discovery. The complete cryptographic purge of your data across active production databases is finalized within 7 business days in accordance with DPDP regulations.',
      isOpen: false,
    },
    {
      question: 'Can I cancel my deletion request if I change my mind?',
      answer:
        'Yes. You have a 7-day grace period from the time of submission. To cancel your request, simply email support@mbbs.net quoting your reference ID from your registered email or phone.',
      isOpen: false,
    },
    {
      question: 'Can I create a new MBBS.NET account in the future?',
      answer:
        'Yes, you are always welcome to register fresh with MBBS.NET using your WhatsApp number or email. However, any previously deleted test scorecards, chapter analytics, and scholarship invitations cannot be retrieved.',
      isOpen: false,
    },
    {
      question: 'Will deleting my account cancel ongoing university applications?',
      answer:
        'Deleting your MBBS.NET account terminates in-app invitation chats and portal communication. However, if you have already submitted formal external documentation or payments directly to a university outside our platform, you will need to contact the university admissions office directly.',
      isOpen: false,
    },
  ]);

  goBack(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }

  toggleFaq(index: number): void {
    this.faqs.update((items) =>
      items.map((item, i) => (i === index ? { ...item, isOpen: !item.isOpen } : item))
    );
  }

  submitDeletionRequest(): void {
    const identifier = this.accountIdentifier().trim();
    if (!identifier) {
      this.submissionError.set('Please provide your registered WhatsApp number or email address.');
      return;
    }

    if (!this.confirmUnderstood()) {
      this.submissionError.set('Please confirm that you understand the permanent nature of data deletion.');
      return;
    }

    this.isSubmitting.set(true);
    this.submissionError.set(null);

    // Simulate reliable queue submission
    setTimeout(() => {
      const generatedRef = 'DEL-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      this.referenceId.set(generatedRef);
      this.isSubmitting.set(false);
      this.submissionSuccess.set(true);
    }, 700);
  }

  resetForm(): void {
    this.accountIdentifier.set('');
    this.selectedReason.set('COMPLETED_EXAM');
    this.additionalNotes.set('');
    this.confirmUnderstood.set(false);
    this.submissionSuccess.set(false);
    this.referenceId.set('');
    this.submissionError.set(null);
  }

  getMailtoLink(): string {
    const subject = encodeURIComponent('Account Deletion Request - MBBS.NET');
    const body = encodeURIComponent(
      `Hello MBBS.NET Privacy & Support Team,\n\nI would like to permanently delete my MBBS.NET account and associated data.\n\nRegistered Phone / WhatsApp: \nRegistered Email: \nReason for Deletion: \n\nI understand that this action is permanent and will delete my test history, profile, and university invitations.\n\nThank you.`
    );
    return `mailto:support@mbbs.net?subject=${subject}&body=${body}`;
  }

  printPage(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
