import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
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
export class Otp implements OnInit, OnDestroy {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly timerSeconds = signal(109); // 01:49 countdown as requested
  private timerInterval: any = null;

  protected readonly otpDigits = signal<string[]>(['', '', '', '']);

  protected readonly phoneNumber = signal(
    sessionStorage.getItem('pendingVerificationPhone') ?? '+91 98765 43210'
  );
  protected readonly fullName = signal(
    sessionStorage.getItem('pendingFullName') ?? 'Student'
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
    this.startResendTimer();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private startResendTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.timerSeconds.set(109);
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
    this.startResendTimer();
  }

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
