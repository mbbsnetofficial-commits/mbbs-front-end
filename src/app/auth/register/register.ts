import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/serivce/auth.service';
import { RegisterRequest } from '../../core/models/auth.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  isSubmitting = false;
  errorMessage = '';
  registerData: RegisterRequest = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  register(): void {
    if (this.isSubmitting) {
      return;
    }
    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.errorMessage = 'Password and confirmation must match.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.authService.register(this.registerData).subscribe({
      next: () => {
        sessionStorage.setItem(
          'pendingVerificationPhone',
          this.registerData.phoneNumber
        );
        this.isSubmitting = false;
        this.router.navigate(['/auth/otp']);
      },

      error: (error) => {
        this.errorMessage =
          error?.error?.message ?? 'Unable to create your account.';
        this.isSubmitting = false;
      }
    });
  }
}
