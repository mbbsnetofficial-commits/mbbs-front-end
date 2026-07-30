import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { environment } from '../../../environments/environments';
import { API } from '../constants/api.constants';
import {
  AuthUser,
  AuthMutationResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  VerifyOtpRequest
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
  ) { }

  register(data: RegisterRequest) {
    return this.http.post<AuthMutationResponse>(
      this.baseUrl + API.AUTH.REGISTER,
      data
    );
  }

  verifyOtp(data: VerifyOtpRequest) {
    return this.http.post<AuthMutationResponse>(
      this.baseUrl + API.AUTH.VERIFY_OTP,
      data
    );
  }

  login(data: LoginRequest) {
    return this.http.post<LoginResponse>(
      this.baseUrl + API.AUTH.LOGIN,
      data
    );
  }

  loginWithGoogle(_remember = true): Observable<LoginResponse> {
    return throwError(() => new Error('Google sign-in is currently unavailable. Please sign in with email and password.'));
  }

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

  logout() {
    return this.http.post(
      this.baseUrl + API.AUTH.LOGOUT,
      {}
    );
  }

  refreshToken(refreshToken: string) {
    return this.http.post<any>(
      this.baseUrl + API.AUTH.REFRESH_TOKEN,
      {
        refreshToken
      }
    );
  }
}
