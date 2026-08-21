import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Icon } from '../../../../shared/ui/icon/icon';
import { UniversityAuthService } from '../../services/university-auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Icon],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent implements OnInit {
  private readonly authService = inject(UniversityAuthService);
  private readonly route = inject(ActivatedRoute);

  token = '';
  newPassword = '';
  confirmPassword = '';
  showPassword = false;

  readonly loading = this.authService.loading;
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const queryToken = this.route.snapshot.queryParamMap.get('token');
    if (queryToken) {
      this.token = queryToken;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const trimmedToken = this.token.trim();
    if (!trimmedToken) {
      this.errorMessage.set('Password reset token is required.');
      return;
    }

    if (!this.newPassword) {
      this.errorMessage.set('Please enter a new password.');
      return;
    }

    if (this.newPassword.length < 8) {
      this.errorMessage.set('Password must be at least 8 characters long.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage.set('Password confirmation does not match.');
      return;
    }

    this.authService
      .resetPassword({
        token: trimmedToken,
        newPassword: this.newPassword,
      })
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.successMessage.set(
              res.message ||
                'Password reset successful. Please log in with your new password.'
            );
          }
        },
        error: (err) => {
          const errorMsg =
            err.error?.message ||
            err.error?.error ||
            err.message ||
            'Password reset failed. Please ensure your token is valid.';
          this.errorMessage.set(errorMsg);
        },
      });
  }
}
