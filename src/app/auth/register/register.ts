import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthShell } from '../shared/auth-shell/auth-shell';
import { Icon } from '../../shared/ui/icon/icon';
import { TokenService } from '../../core/serivce/token.service';

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
  private readonly tokenService = inject(TokenService);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  protected readonly registerForm = this.formBuilder.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    whatsappNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
    otp: ['', [Validators.required, Validators.minLength(4)]],
    termsAccepted: [false, Validators.requiredTrue]
  });

  protected register(): void {
    if (this.registerForm.invalid || this.isSubmitting()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    // Simulate API delay
    setTimeout(() => {
      // Mock successful registration and auto-login
      const dummyStudentId = 'student_dummy_new';
      const raw = this.registerForm.getRawValue();

      this.tokenService.saveTokens(
        'dummy_access_token',
        'dummy_refresh_token',
        dummyStudentId,
        true
      );
      this.tokenService.saveUser({
        student_id: dummyStudentId,
        first_name: raw.firstName.trim(),
        last_name: raw.lastName.trim(),
        email: 'dummy_registered@example.com'
      }, true);

      this.isSubmitting.set(false);
      this.successMessage.set('Account created successfully! Opening your chat…');
      this.router.navigate(['/dynamic/ai-chat']);
    }, 800);
  }
}
