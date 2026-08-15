import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthShell } from '../shared/auth-shell/auth-shell';
import { Icon } from '../../shared/ui/icon/icon';
import { TokenService } from '../../core/serivce/token.service';

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
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly phoneNumber = signal(
    sessionStorage.getItem('pendingVerificationPhone') ?? '+91 98765 43210'
  );
  protected readonly fullName = signal(
    sessionStorage.getItem('pendingFullName') ?? 'Student'
  );

  protected readonly verificationForm = this.formBuilder.group({
    otp: ['', [Validators.required, Validators.pattern(/^[0-9]{4}$/)]]
  });

  protected verifyOtp(): void {
    if (this.verificationForm.invalid || this.isSubmitting()) {
      this.verificationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const dummyStudentId = 'student_dummy_new';
    const nameParts = this.fullName().trim().split(' ');
    const firstName = nameParts[0] || 'Student';
    const lastName = nameParts.slice(1).join(' ') || '';

    this.tokenService.saveTokens(
      'dummy_access_token',
      'dummy_refresh_token',
      dummyStudentId,
      true
    );
    this.tokenService.saveUser({
      student_id: dummyStudentId,
      firstName,
      lastName,
      fullName: this.fullName(),
      phone: this.phoneNumber(),
      email: 'student@mbbs.net'
    } as any, true);

    sessionStorage.removeItem('pendingVerificationPhone');
    sessionStorage.removeItem('pendingFullName');

    this.router.navigate(['/dynamic/ai-chat']);
  }
}
