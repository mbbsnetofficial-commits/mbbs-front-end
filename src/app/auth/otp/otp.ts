import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthShell } from '../shared/auth-shell/auth-shell';
import { AuthService } from '../../core/serivce/auth.service';
import { Icon } from '../../shared/ui/icon/icon';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [AuthShell, Icon, ReactiveFormsModule, RouterLink],
  templateUrl: './otp.html',
  styleUrl: './otp.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Otp {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly verificationForm = this.formBuilder.group({
    phoneNumber: [
      sessionStorage.getItem('pendingVerificationPhone') ?? '',
      [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]
    ],
    otp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
  });

  protected verifyOtp(): void {
    if (this.verificationForm.invalid || this.isSubmitting()) {
      this.verificationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.authService.verifyOtp(this.verificationForm.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          sessionStorage.removeItem('pendingVerificationPhone');
          this.router.navigate(['/auth/login']);
        },
        error: (error: unknown) => {
          const apiError = error as { error?: { message?: string }; message?: string };
          this.errorMessage.set(apiError.error?.message ?? apiError.message ?? 'Unable to verify this code.');
        }
      });
  }
}
