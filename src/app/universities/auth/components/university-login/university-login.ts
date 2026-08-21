import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Icon } from '../../../../shared/ui/icon/icon';
import { UniversityAuthService } from '../../services/university-auth.service';

@Component({
  selector: 'app-university-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Icon],
  templateUrl: './university-login.html',
  styleUrl: './university-login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UniversityLoginComponent {
  private readonly authService = inject(UniversityAuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  showPassword = false;

  readonly loading = this.authService.loading;
  readonly errorMessage = signal<string | null>(null);

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.errorMessage.set(null);

    const trimmedEmail = this.email.trim();
    if (!trimmedEmail || !this.password) {
      this.errorMessage.set(
        'Please provide both university email and password.'
      );
      return;
    }

    this.authService
      .login({
        email: trimmedEmail,
        password: this.password,
      })
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.router.navigate(['/university/dashboard']);
          }
        },
        error: (err) => {
          const errorMsg =
            err.error?.message ||
            err.error?.error ||
            err.message ||
            'Login failed. Please verify your credentials.';
          this.errorMessage.set(errorMsg);
        },
      });
  }
}
