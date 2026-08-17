import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthShell } from '../shared/auth-shell/auth-shell';
import { Icon } from '../../../shared/ui/icon/icon';
import { AuthService } from '../../services/auth.service';

function tenDigitPhoneValidator(control: AbstractControl): ValidationErrors | null {
  const digits = (control.value || '').replace(/\D/g, '');
  return digits.length === 10 ? null : { invalidPhone: true };
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [AuthShell, Icon, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  protected readonly loginForm = this.formBuilder.group({
    countryCode: ['+91', [Validators.required]],
    whatsappNumber: ['', [Validators.required, tenDigitPhoneValidator]],
    rememberMe: [true]
  });

  protected onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input) return;

    const rawDigits = input.value.replace(/\D/g, '').slice(0, 10);
    let formatted = rawDigits;
    if (rawDigits.length > 5) {
      formatted = `${rawDigits.slice(0, 5)} ${rawDigits.slice(5)}`;
    }

    input.value = formatted;
    this.loginForm.controls.whatsappNumber.setValue(formatted, { emitEvent: false });
  }

  protected login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const raw = this.loginForm.getRawValue();
    const cleanDigits = raw.whatsappNumber.replace(/\D/g, '');
    const e164Phone = `${raw.countryCode}${cleanDigits}`;
    const displayPhone = `${raw.countryCode} ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.authService.requestLoginOtp({ phoneNumber: e164Phone }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        sessionStorage.setItem('pendingVerificationPhone', e164Phone);
        sessionStorage.setItem('pendingFormattedPhone', displayPhone);
        sessionStorage.setItem('pendingFullName', 'Student');
        sessionStorage.setItem('pendingAuthPurpose', 'login');
        sessionStorage.setItem('pendingOtpExpiresIn', String(res?.data?.expiresInMinutes || 5));

        this.router.navigate(['/auth/otp']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err?.error?.message || err?.message || 'Unable to send verification code. Please check your number and try again.';
        this.errorMessage.set(msg);
      }
    });
  }
}
