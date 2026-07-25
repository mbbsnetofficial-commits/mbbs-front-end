import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/serivce/auth.service';
import { VerifyOtpRequest } from '../../core/models/auth.model';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './otp.html',
  styleUrl: './otp.scss'
})
export class Otp {
  isSubmitting = false;
  errorMessage = '';

  otpData: VerifyOtpRequest = {
    phoneNumber: '',
    otp: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.otpData.phoneNumber =
      sessionStorage.getItem('pendingVerificationPhone') ?? '';
  }

  verifyOtp(): void {
    if (this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;
    this.errorMessage = '';
    this.authService.verifyOtp(this.otpData).subscribe({
      next: () => {
        sessionStorage.removeItem('pendingVerificationPhone');
        this.isSubmitting = false;
        this.router.navigate(['/auth/login']);
      },

      error: (error) => {
        this.errorMessage =
          error?.error?.message ?? 'Unable to verify this OTP.';
        this.isSubmitting = false;
      }
    });
  }

}
