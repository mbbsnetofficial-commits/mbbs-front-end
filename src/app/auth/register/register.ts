import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthShell } from '../shared/auth-shell/auth-shell';
import { AuthService } from '../../core/serivce/auth.service';
import { RegisterRequest } from '../../core/models/auth.model';
import { Icon } from '../../shared/ui/icon/icon';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmation = control.get('confirmPassword')?.value;
  return password && confirmation && password !== confirmation
    ? { passwordMismatch: true }
    : null;
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
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly passwordVisible = signal(false);

  protected readonly registerForm = this.formBuilder.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    ]],
    confirmPassword: ['', Validators.required],
    termsAccepted: [false, Validators.requiredTrue]
  }, { validators: passwordsMatch });

  private readonly password = toSignal(
    this.registerForm.controls.password.valueChanges,
    { initialValue: '' }
  );

  protected readonly passwordScore = computed(() => {
    const value = this.password();
    return [
      value.length >= 8,
      /[a-z]/.test(value) && /[A-Z]/.test(value),
      /\d/.test(value),
      /[^A-Za-z0-9]/.test(value)
    ].filter(Boolean).length;
  });

  protected readonly passwordStrength = computed(() => {
    const score = this.passwordScore();
    if (!this.password()) {
      return 'Enter a password';
    }
    return ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][score];
  });

  protected register(): void {
    if (this.registerForm.invalid || this.isSubmitting()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    const raw = this.registerForm.getRawValue();
    const request: RegisterRequest = {
      firstName: raw.firstName.trim(),
      lastName: raw.lastName.trim(),
      email: raw.email.trim(),
      phoneNumber: raw.phoneNumber.trim(),
      password: raw.password,
      confirmPassword: raw.confirmPassword
    };

    this.authService.register(request)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          sessionStorage.setItem('pendingVerificationPhone', request.phoneNumber);
          this.router.navigate(['/auth/otp']);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.getErrorMessage(error, 'Unable to create your account. Please review your details.'));
        }
      });
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error !== 'object' || error === null) {
      return fallback;
    }
    const apiError = error as { error?: { message?: string }; message?: string };
    return apiError.error?.message ?? apiError.message ?? fallback;
  }
}
