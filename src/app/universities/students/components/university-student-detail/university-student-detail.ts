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

  readonly student = this.studentsService.currentStudent;
  readonly loading = this.studentsService.loading;
  readonly error = this.studentsService.error;

  readonly studentId = signal<string>('');

  // Send Offer modal state (API #8)
  readonly showOfferModal = signal<boolean>(false);
  readonly sendingOffer = this.invitesService.sending;
  readonly offerSuccessMessage = signal<string | null>(null);
  readonly offerErrorMessage = signal<string | null>(null);

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
    this.showOfferModal.set(true);
  }

  closeOfferModal(): void {
    if (this.sendingOffer()) return;
    this.showOfferModal.set(false);
    this.offerErrorMessage.set(null);
  }

  submitOffer(): void {
    const targetId = this.studentId();
    if (!targetId || !this.offerSubject.trim() || this.sendingOffer()) return;

    this.offerErrorMessage.set(null);

    this.invitesService
      .sendInvitation({
        studentId: targetId,
        subject: this.offerSubject.trim(),
        message: this.offerMessage.trim() || undefined,
        course: this.offerCourse.trim() || undefined,
        tuitionFeeUsd: this.offerTuition !== null && !isNaN(this.offerTuition)
          ? this.offerTuition
          : undefined,
        intake: this.offerIntake.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.offerSuccessMessage.set(
              `Admission offer successfully dispatched to candidate ${targetId}.`
            );
            this.showOfferModal.set(false);
            setTimeout(() => {
              this.offerSuccessMessage.set(null);
            }, 5000);
          }
        },
        error: (err) => {
          const msg =
            err?.error?.message ||
            err?.error?.error ||
            err?.message ||
            'Failed to dispatch admission offer. Please try again.';
          this.offerErrorMessage.set(msg);
        },
      });
  }
}
