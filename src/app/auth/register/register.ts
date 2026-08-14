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
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    whatsappNumber: ['', [Validators.required]],
    otp: ['', [Validators.required]],
    termsAccepted: [true]
  });

  protected register(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

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
      firstName: raw.firstName.trim() || 'New',
      lastName: raw.lastName.trim() || 'Student',
      email: 'student@mbbs.net'
    } as any, true);

    this.router.navigate(['/dynamic/ai-chat']);
  }
}
