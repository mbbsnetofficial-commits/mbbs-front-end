import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthShell } from '../shared/auth-shell/auth-shell';
import { AuthService } from '../../core/serivce/auth.service';
import { TokenService } from '../../core/serivce/token.service';
import { Icon } from '../../shared/ui/icon/icon';

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
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly passwordVisible = signal(false);

  protected readonly loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [true]
  });

  protected login(): void {
    if (this.loginForm.invalid || this.isSubmitting()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    const { email, password, rememberMe } = this.loginForm.getRawValue();

    this.authService.login({ email, password })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.tokenService.saveTokens(
            response.data.accessToken,
            response.data.refreshToken,
            response.data.student_id,
            rememberMe
          );
          this.successMessage.set('Welcome back. Opening your dashboard…');
          this.router.navigate(['/dynamic/dashboard']);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.getErrorMessage(error, 'Unable to log in. Check your email and password.'));
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
