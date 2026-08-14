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
    whatsappNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
    otp: ['', [Validators.required, Validators.minLength(4)]],
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
    const { rememberMe } = this.loginForm.getRawValue();

    // Simulate API delay
    setTimeout(() => {
      // Mock successful login
      const dummyStudentId = 'student_dummy_123';
      this.tokenService.saveTokens(
        'dummy_access_token',
        'dummy_refresh_token',
        dummyStudentId,
        rememberMe
      );
      this.tokenService.saveUser({
        student_id: dummyStudentId,
        first_name: 'Dummy',
        last_name: 'User',
        email: 'dummy@example.com'
      }, rememberMe);

      this.isSubmitting.set(false);
      this.successMessage.set('Login successful! Opening your chat…');
      this.router.navigate(['/dynamic/ai-chat']);
    }, 800);
  }
}
