import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthShell } from '../shared/auth-shell/auth-shell';
import { Icon } from '../../shared/ui/icon/icon';

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

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  protected readonly registerForm = this.formBuilder.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    countryCode: ['+91', [Validators.required]],
    whatsappNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    termsAccepted: [true, [Validators.requiredTrue]]
  });

  protected onFullNameBlur(): void {
    const current = this.registerForm.controls.fullName.value;
    if (current) {
      const proper = this.toProperCase(current);
      this.registerForm.controls.fullName.setValue(proper);
    }
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

    const fullPhone = `${raw.countryCode} ${raw.whatsappNumber.trim()}`;

    sessionStorage.setItem('pendingVerificationPhone', fullPhone);
    sessionStorage.setItem('pendingFullName', properFullName);

    this.router.navigate(['/auth/otp']);
  }
}
