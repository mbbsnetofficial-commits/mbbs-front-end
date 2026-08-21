import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthShell } from '../shared/auth-shell/auth-shell';
import { Icon } from '../../../../shared/ui/icon/icon';
import { TokenService } from '../../services/token.service';
import { AuthService } from '../../services/auth.service';
import { AuthOtpPurpose } from '../../models/auth.model';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [AuthShell, Icon, ReactiveFormsModule, RouterLink],
  templateUrl: './otp.html',
  styleUrl: './otp.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Otp implements OnInit, OnDestroy {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);

  protected readonly isSubmitting = signal(false);
  protected readonly isResending = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly timerSeconds = signal(60);
  private timerInterval: any = null;

  protected readonly otpDigits = signal<string[]>(['', '', '', '']);

  protected readonly rawPhoneNumber = signal<string>(
    sessionStorage.getItem('pendingVerificationPhone') ?? '+919444308959'
  );
  protected readonly phoneNumber = signal<string>(
    sessionStorage.getItem('pendingFormattedPhone') ??
    sessionStorage.getItem('pendingVerificationPhone') ??
    '+91 94443 08959'
  );
  protected readonly fullName = signal<string>(
    sessionStorage.getItem('pendingFullName') ?? 'Student'
  );
  protected readonly authPurpose = signal<AuthOtpPurpose>(
    (sessionStorage.getItem('pendingAuthPurpose') as AuthOtpPurpose) ?? 'login'
  );

  protected readonly verificationForm = this.formBuilder.group({
    otp: ['', [Validators.required, Validators.pattern(/^[0-9]{4}$/)]]
  });

  protected readonly formattedTimer = computed(() => {
    const totalSec = this.timerSeconds();
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const minStr = mins.toString().padStart(2, '0');
    const secStr = secs.toString().padStart(2, '0');
    return `${minStr}:${secStr}`;
  });

  ngOnInit(): void {
    const storedExpiry = sessionStorage.getItem('pendingOtpExpiresIn');
    const expiryMins = storedExpiry ? parseInt(storedExpiry, 10) : 1;
    this.startResendTimer(expiryMins * 60);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private startResendTimer(seconds = 60): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.timerSeconds.set(seconds);
    this.timerInterval = setInterval(() => {
      if (this.timerSeconds() > 0) {
        this.timerSeconds.update(s => s - 1);
      } else {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  protected onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');

    const digits = [...this.otpDigits()];

    if (value.length > 0) {
      const lastChar = value.slice(-1);
      digits[index] = lastChar;
      input.value = lastChar;

      if (index < 3) {
        const nextInput = input.nextElementSibling as HTMLInputElement;
        nextInput?.focus();
        nextInput?.select();
      }
    } else {
      digits[index] = '';
    }

    this.otpDigits.set(digits);
    this.verificationForm.controls.otp.setValue(digits.join(''));
  }

  protected onDigitKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace') {
      if (!input.value && index > 0) {
        const prevInput = input.previousElementSibling as HTMLInputElement;
        prevInput?.focus();
        const digits = [...this.otpDigits()];
        digits[index - 1] = '';
        this.otpDigits.set(digits);
        this.verificationForm.controls.otp.setValue(digits.join(''));
      }
    }
  }

  protected onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 4);
    if (!pastedData) return;

    const digits = ['', '', '', ''];
    for (let i = 0; i < pastedData.length; i++) {
      digits[i] = pastedData[i];
    }
    this.otpDigits.set(digits);
    this.verificationForm.controls.otp.setValue(digits.join(''));

    const container = event.currentTarget as HTMLElement;
    const inputs = container.querySelectorAll('input');
    const focusIndex = Math.min(pastedData.length, 3);
    inputs[focusIndex]?.focus();
  }

  protected resendCode(): void {
    if (this.timerSeconds() > 0 || this.isResending()) {
      return;
    }

    this.isResending.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const phone = this.rawPhoneNumber();
    const purpose = this.authPurpose();

    this.authService.resendOtp({ phoneNumber: phone, purpose }).subscribe({
      next: (res) => {
        this.isResending.set(false);
        this.successMessage.set(res.message || 'Verification code resent successfully.');
        this.startResendTimer(60);
      },
      error: (err) => {
        this.isResending.set(false);
        const retryAfter = err?.error?.retry_after_seconds;
        if (retryAfter) {
          this.startResendTimer(retryAfter);
        }
        const msg = err?.error?.message || err?.message || 'Unable to resend verification code. Please wait a moment.';
        this.errorMessage.set(msg);
      }
    });
  }

  protected verifyOtp(): void {
    if (this.verificationForm.invalid || this.isSubmitting()) {
      this.verificationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const phone = this.rawPhoneNumber();
    const otpValue = this.verificationForm.controls.otp.value.trim();
    const purpose = this.authPurpose();

    const verifyReq$ = purpose === 'register'
      ? this.authService.verifyRegisterOtp({ phoneNumber: phone, otp: otpValue })
      : this.authService.verifyLoginOtp({ phoneNumber: phone, otp: otpValue });

    verifyReq$.subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        const authData = res?.data;

        if (authData) {
          const accessToken = authData.accessToken || authData.authtoken || '';
          const refreshToken = authData.refreshToken || '';
          const studentId = authData.student_id || authData.user?.student_id || authData.user?.id || '';

          this.tokenService.saveTokens(accessToken, refreshToken, studentId, true);

          if (authData.user) {
            this.tokenService.saveUser(authData.user, true);
          } else {
            this.tokenService.saveUser({
              student_id: studentId,
              fullName: this.fullName(),
              phoneNumber: phone
            } as any, true);
          }
        }

        // Clean up pending auth session state
        sessionStorage.removeItem('pendingVerificationPhone');
        sessionStorage.removeItem('pendingFormattedPhone');
        sessionStorage.removeItem('pendingFullName');
        sessionStorage.removeItem('pendingAuthPurpose');
        sessionStorage.removeItem('pendingOtpExpiresIn');

        this.router.navigate(['/dynamic/neet']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err?.error?.message || err?.message || 'Verification code is incorrect or has expired.';
        this.errorMessage.set(msg);
      }
    });
  }
}
