import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API } from '../constants/api.constants';
import {
  AuthMutationResponse,
  AuthSuccessResponse,
  AuthUser,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginOtpRequest,
  LoginOtpResponse,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
  ResendOtpRequest,
  ResendOtpResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  VerifyLoginOtpRequest,
  VerifyRegisterOtpRequest,
  VerifyResetOtpRequest,
  VerifyResetOtpResponse
} from '../models/auth.model';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly tokenService: TokenService
  ) {}

  /**
   * 1. Register - Request WhatsApp OTP
   * POST /api/v1/auth/sign-up
   */
  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(
      this.baseUrl + API.AUTH.SIGN_UP,
      data
    );
  }

  /**
   * 2. Register - Verify OTP & Create Session
   * POST /api/v1/auth/sign-up/verify-otp
   */
  verifyRegisterOtp(data: VerifyRegisterOtpRequest): Observable<AuthSuccessResponse> {
    return this.http.post<AuthSuccessResponse>(
      this.baseUrl + API.AUTH.VERIFY_SIGN_UP_OTP,
      data
    );
  }

  /**
   * 3. Login - Request WhatsApp OTP
   * POST /api/v1/auth/login
   */
  requestLoginOtp(data: LoginOtpRequest): Observable<LoginOtpResponse> {
    return this.http.post<LoginOtpResponse>(
      this.baseUrl + API.AUTH.LOGIN,
      data
    );
  }

  /**
   * 4. Login - Verify OTP & Create Session
   * POST /api/v1/auth/login/verify-otp
   */
  verifyLoginOtp(data: VerifyLoginOtpRequest): Observable<AuthSuccessResponse> {
    return this.http.post<AuthSuccessResponse>(
      this.baseUrl + API.AUTH.VERIFY_LOGIN_OTP,
      data
    );
  }

  /**
   * 5. Resend OTP
   * POST /api/v1/auth/resend-otp
   */
  resendOtp(data: ResendOtpRequest): Observable<ResendOtpResponse> {
    return this.http.post<ResendOtpResponse>(
      this.baseUrl + API.AUTH.RESEND_OTP,
      data
    );
  }

  /**
   * 6. Refresh Token
   * POST /api/v1/auth/refresh-token
   */
  refreshToken(refreshToken: string): Observable<RefreshTokenResponse> {
    return this.http.post<RefreshTokenResponse>(
      this.baseUrl + API.AUTH.REFRESH_TOKEN,
      { refreshToken }
    );
  }

  /**
   * 7. Logout Current Device
   * POST /api/v1/auth/logout
   */
  logout(): Observable<AuthMutationResponse> {
    return this.http.post<AuthMutationResponse>(
      this.baseUrl + API.AUTH.LOGOUT,
      {}
    );
  }

  /**
   * 8. Logout All Devices
   * POST /api/v1/auth/logout-all
   */
  logoutAll(): Observable<AuthMutationResponse> {
    return this.http.post<AuthMutationResponse>(
      this.baseUrl + API.AUTH.LOGOUT_ALL,
      {}
    );
  }

  /**
   * 9. Forgot Password - Request Reset OTP
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword(data: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(
      this.baseUrl + API.AUTH.FORGOT_PASSWORD,
      data
    );
  }

  /**
   * 10. Verify Reset OTP - Obtain resetToken
   * POST /api/v1/auth/verify-reset-otp
   */
  verifyResetOtp(data: VerifyResetOtpRequest): Observable<VerifyResetOtpResponse> {
    return this.http.post<VerifyResetOtpResponse>(
      this.baseUrl + API.AUTH.VERIFY_RESET_OTP,
      data
    );
  }

  /**
   * 11. Reset Password with resetToken
   * POST /api/v1/auth/reset-password
   */
  resetPassword(data: ResetPasswordRequest): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(
      this.baseUrl + API.AUTH.RESET_PASSWORD,
      data
    );
  }

  // Token helper state methods
  saveTokens(
    accessToken: string,
    refreshToken: string,
    studentId?: string,
    remember = true
  ): void {
    this.tokenService.saveTokens(accessToken, refreshToken, studentId, remember);
  }

  saveUser(user: AuthUser, remember = true): void {
    this.tokenService.saveUser(user, remember);
  }

  isLoggedIn(): boolean {
    return this.tokenService.isLoggedIn();
  }

  getAccessToken(): string | null {
    return this.tokenService.getAccessToken();
  }

  getCurrentUser(): AuthUser | null {
    return this.tokenService.getCurrentUser();
  }

  clearTokens(): void {
    this.tokenService.clearTokens();
  }
}
