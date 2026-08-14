import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { TokenService } from '../../core/serivce/token.service';
import { Icon } from '../../shared/ui/icon/icon';
import { AuthShell } from '../shared/auth-shell/auth-shell';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthShell, Icon],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  protected readonly loginForm = this.formBuilder.group({
    whatsappNumber: ['', [Validators.required]],
    otp: ['', [Validators.required]],
    rememberMe: [true]
  });

  protected login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { rememberMe } = this.loginForm.getRawValue();

    const dummyStudentId = 'student_dummy_123';
    this.tokenService.saveTokens(
      'dummy_access_token',
      'dummy_refresh_token',
      dummyStudentId,
      rememberMe
    );
    this.tokenService.saveUser({
      student_id: dummyStudentId,
      firstName: 'Student',
      lastName: 'User',
      email: 'student@mbbs.net'
    } as any, rememberMe);

    this.router.navigate(['/dynamic/ai-chat']);
  }
}
