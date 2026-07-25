import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/serivce/auth.service';
import { TokenService } from '../../core/serivce/token.service';
import { LoginRequest } from '../../core/models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  isSubmitting = false;
  errorMessage = '';

  loginData: LoginRequest = {
    email: '',
    password: ''
  };

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router
  ) {}

  login(): void {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.authService.login(this.loginData).subscribe({
      next: (response: any) => {
        this.tokenService.saveTokens(
          response.data.accessToken,
          response.data.refreshToken,
          response.data.student_id
        );
        this.isSubmitting = false;
        this.router.navigate(['/dynamic/dashboard']);
      },

      error: (error) => {
        this.errorMessage =
          error?.error?.message ?? 'Unable to log in. Please check your details.';
        this.isSubmitting = false;
      }
    });
  }

}
