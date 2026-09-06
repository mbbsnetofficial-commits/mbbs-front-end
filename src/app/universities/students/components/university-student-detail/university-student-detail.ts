import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Icon } from '../../../../shared/ui/icon/icon';
import { UniversityHeaderComponent } from '../../../shared/components/university-header/university-header';
import { UniversityInvitesService } from '../../../invites/services/university-invites.service';
import { UniversityStudentsService } from '../../services/university-students.service';
import { UniversityTemplatesService } from '../../../templates/services/university-templates.service';
import { UniversityProfileService } from '../../../profile/services/university-profile.service';
import { UniversityAuthService } from '../../../auth/services/university-auth.service';

@Component({
  selector: 'app-university-student-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, Icon, UniversityHeaderComponent],
  templateUrl: './university-student-detail.html',
  styleUrl: './university-student-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UniversityStudentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly studentsService = inject(UniversityStudentsService);
  private readonly invitesService = inject(UniversityInvitesService);
  private readonly templatesService = inject(UniversityTemplatesService);
  private readonly profileService = inject(UniversityProfileService);
  private readonly authService = inject(UniversityAuthService);

  readonly student = this.studentsService.currentStudent;
  readonly loading = this.studentsService.loading;
  readonly error = this.studentsService.error;

  readonly studentId = signal<string>('');

  // Send Offer modal state (API #8)
  readonly showOfferModal = signal<boolean>(false);
  readonly sendingOffer = this.invitesService.sending;
  readonly offerSuccessMessage = signal<string | null>(null);
  readonly offerErrorMessage = signal<string | null>(null);

  // Duplicate Active Invitation Pop-up state
  readonly showDuplicateInvitePopup = signal<boolean>(false);
  readonly resendingOffer = signal<boolean>(false);
  readonly duplicateErrorMessage = signal<string | null>(null);

  // University Templates Integration
  readonly templates = this.templatesService.templates;
  readonly templatesLoading = this.templatesService.loading;
  readonly selectedTemplateId = signal<string>('');
  readonly appliedTemplateName = signal<string>('');

  offerSubject = 'Direct MBBS Admission Offer';
  offerMessage = '';
  offerCourse = 'MBBS';
  offerTuition: number | null = null;
  offerIntake = 'September';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('studentId');
    if (id) {
      this.studentId.set(id);
      this.loadStudentProfile(id);
    } else {
      this.route.paramMap.subscribe((params) => {
        const paramId = params.get('studentId');
        if (paramId) {
          this.studentId.set(paramId);
          this.loadStudentProfile(paramId);
        }
      });
    }
  }

  loadStudentProfile(id?: string): void {
    const targetId = id || this.studentId();
    if (!targetId) return;

    this.studentsService.getStudent(targetId).subscribe({
      error: () => {
        // Error state handled by signal
      },
    });
  }

  retry(): void {
    this.loadStudentProfile();
  }

  openOfferModal(): void {
    const current = this.student();
    if (current?.preferences?.course) {
      this.offerCourse = current.preferences.course;
    }
    if (current?.preferences?.preferredBudgetUsd) {
      this.offerTuition = current.preferences.preferredBudgetUsd;
    }
    if (current?.preferences?.preferredIntake) {
      this.offerIntake = current.preferences.preferredIntake;
    }
    this.offerErrorMessage.set(null);
    this.showDuplicateInvitePopup.set(false);
    this.duplicateErrorMessage.set(null);

    // Fetch university's saved templates
    this.templatesService.getTemplates(1, 50).subscribe({
      error: () => {
        // Handled silently; templates fallback to cached or empty
      },
    });

    this.showOfferModal.set(true);
  }

  onTemplateChange(templateId: string): void {
    if (!templateId) {
      this.selectedTemplateId.set('');
      this.appliedTemplateName.set('');
      this.offerSubject = 'Direct MBBS Admission Offer';
      this.offerMessage = '';
      return;
    }

    const template = this.templates().find((t) => t._id === templateId);
    if (template) {
      this.selectedTemplateId.set(template._id);
      this.appliedTemplateName.set(template.name);
      this.offerSubject = this.resolveTemplateText(template.subject);
      this.offerMessage = this.resolveTemplateText(template.message);
    }
  }

  resetToTemplateDefaults(): void {
    const currentId = this.selectedTemplateId();
    if (currentId) {
      this.onTemplateChange(currentId);
    }
  }

  insertPlaceholder(tag: string): void {
    const resolved = this.resolveTemplateText(tag);
    if (!this.offerMessage) {
      this.offerMessage = resolved;
    } else {
      this.offerMessage = `${this.offerMessage} ${resolved}`;
    }
  }

  resolveTemplateText(text: string): string {
    if (!text) return '';
    const s = this.student();
    const studentName = s?.personal?.fullName || 'Candidate';
    const studentId = this.studentId() || s?.studentId || '';
    const univName =
      this.profileService.profile()?.name ||
      this.authService.currentUser()?.name ||
      'Medical University';
    const course = this.offerCourse || s?.preferences?.course || 'MBBS';
    const intake = this.offerIntake || s?.preferences?.preferredIntake || 'September 2026';
    const fee =
      this.offerTuition !== null && !isNaN(this.offerTuition)
        ? `$${this.offerTuition.toLocaleString()}`
        : 'Tuition as published';

    return text
      .replace(/\{\{\s*student_name\s*\}\}/gi, studentName)
      .replace(/\{\{\s*student_id\s*\}\}/gi, studentId)
      .replace(/\{\{\s*university_name\s*\}\}/gi, univName)
      .replace(/\{\{\s*course\s*\}\}/gi, course)
      .replace(/\{\{\s*intake\s*\}\}/gi, intake)
      .replace(/\{\{\s*tuition_fee\s*\}\}/gi, fee);
  }

  closeOfferModal(): void {
    if (this.sendingOffer() || this.resendingOffer()) return;
    this.showOfferModal.set(false);
    this.showDuplicateInvitePopup.set(false);
    this.offerErrorMessage.set(null);
    this.duplicateErrorMessage.set(null);
  }

  closeDuplicatePopup(): void {
    if (this.resendingOffer()) return;
    this.showDuplicateInvitePopup.set(false);
    this.duplicateErrorMessage.set(null);
  }

  confirmResendOffer(): void {
    this.submitOffer(true);
  }

  submitOffer(resend = false): void {
    const targetId = this.studentId();
    if (
      !targetId ||
      !this.offerSubject.trim() ||
      this.sendingOffer() ||
      this.resendingOffer()
    ) {
      return;
    }

    if (resend) {
      this.resendingOffer.set(true);
      this.duplicateErrorMessage.set(null);
    } else {
      this.offerErrorMessage.set(null);
    }

    this.invitesService
      .sendInvitation({
        studentId: targetId,
        templateId: this.selectedTemplateId() || undefined,
        subject: this.offerSubject.trim(),
        message: this.offerMessage.trim() || undefined,
        course: this.offerCourse.trim() || undefined,
        tuitionFeeUsd:
          this.offerTuition !== null && !isNaN(this.offerTuition)
            ? this.offerTuition
            : undefined,
        intake: this.offerIntake.trim() || undefined,
        resend: resend ? true : undefined,
      })
      .subscribe({
        next: (res) => {
          this.resendingOffer.set(false);
          if (res?.success) {
            this.showDuplicateInvitePopup.set(false);
            this.showOfferModal.set(false);
            this.offerSuccessMessage.set(
              resend
                ? `Admission offer successfully updated and resent to candidate ${targetId}.`
                : `Admission offer successfully dispatched to candidate ${targetId}.`
            );
            setTimeout(() => {
              this.offerSuccessMessage.set(null);
            }, 5000);
          }
        },
        error: (err) => {
          this.resendingOffer.set(false);
          const errorCode = err?.error?.error?.code || err?.error?.code;
          const rawMsg =
            err?.error?.message ||
            err?.error?.error?.message ||
            err?.error?.error ||
            err?.message ||
            'Failed to dispatch admission offer. Please try again.';

          const isDuplicate =
            !resend &&
            (err.status === 409 ||
              errorCode === 'ACTIVE_INVITE_EXISTS' ||
              (typeof rawMsg === 'string' &&
                rawMsg.toLowerCase().includes('active invitation already exists')));

          if (isDuplicate) {
            // Do NOT display error in modal form; open dedicated pop-up modal
            this.offerErrorMessage.set(null);
            this.duplicateErrorMessage.set(null);
            this.showDuplicateInvitePopup.set(true);
          } else if (resend) {
            this.duplicateErrorMessage.set(rawMsg);
          } else {
            this.offerErrorMessage.set(rawMsg);
          }
        },
      });
  }
}
