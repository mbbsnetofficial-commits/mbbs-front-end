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
  selector: 'app-register',
  standalone: true,
  imports: [AuthShell, Icon, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Register {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  protected readonly registerForm = this.formBuilder.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    countryCode: ['+91', [Validators.required]],
    whatsappNumber: ['', [Validators.required, tenDigitPhoneValidator]],
    termsAccepted: [true, [Validators.requiredTrue]]
  });

  protected onFullNameInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (!inputElement) return;

    const cursorStart = inputElement.selectionStart;
    const rawVal = inputElement.value;

    const properVal = this.toProperCase(rawVal);
    if (properVal !== rawVal) {
      this.registerForm.controls.fullName.setValue(properVal, { emitEvent: false });
      inputElement.value = properVal;
      if (cursorStart !== null) {
        inputElement.setSelectionRange(cursorStart, cursorStart);
      }
    }
  }

  protected onFullNameBlur(): void {
    const current = this.registerForm.controls.fullName.value;
    if (current) {
      const proper = this.toProperCase(current);
      this.registerForm.controls.fullName.setValue(proper);
    }
  }

  protected onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input) return;

    const rawDigits = input.value.replace(/\D/g, '').slice(0, 10);
    let formatted = rawDigits;
    if (rawDigits.length > 5) {
      formatted = `${rawDigits.slice(0, 5)} ${rawDigits.slice(5)}`;
    }

    input.value = formatted;
    this.registerForm.controls.whatsappNumber.setValue(formatted, { emitEvent: false });
  }

  private toProperCase(str: string): string {
    return str.replace(/\b\w+/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  }

  protected register(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const raw = this.registerForm.getRawValue();
    const properFullName = this.toProperCase(raw.fullName.trim());
    this.registerForm.controls.fullName.setValue(properFullName);

    const cleanDigits = raw.whatsappNumber.replace(/\D/g, '');
    const e164Phone = `${raw.countryCode}${cleanDigits}`;
    const displayPhone = `${raw.countryCode} ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.authService.register({
      fullName: properFullName,
      phoneNumber: e164Phone
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        sessionStorage.setItem('pendingVerificationPhone', e164Phone);
        sessionStorage.setItem('pendingFormattedPhone', displayPhone);
        sessionStorage.setItem('pendingFullName', properFullName);
        sessionStorage.setItem('pendingAuthPurpose', 'register');
        sessionStorage.setItem('pendingOtpExpiresIn', String(res?.data?.expiresInMinutes || 5));

        this.router.navigate(['/auth/otp']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err?.error?.message || err?.message || 'Unable to register. Please check your details and try again.';
        this.errorMessage.set(msg);
      }
    });
  }
}
