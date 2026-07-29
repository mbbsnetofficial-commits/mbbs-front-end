import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  GoogleAuthProvider,
  getAuth,
  signInWithPopup
} from 'firebase/auth';
import { Observable, defer, from, switchMap, tap } from 'rxjs';

import { environment } from '../../../environments/environments';
import { API } from '../constants/api.constants';
import {
  AuthUser,
  AuthMutationResponse,
  GoogleLoginRequest,
  GoogleLoginResponse,
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
  private firebaseAuth?: Auth;

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

  loginWithGoogle(remember = true): Observable<GoogleLoginResponse> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    return defer(() => signInWithPopup(this.getFirebaseAuth(), provider)).pipe(
      switchMap(({ user }) => from(user.getIdToken())),
      switchMap((idToken) => this.exchangeGoogleToken(idToken)),
      tap(({ data }) => {
        this.tokenService.saveTokens(
          data.accessToken,
          data.refreshToken,
          data.user?.student_id,
          remember
        );

        if (data.user) {
          this.tokenService.saveUser(data.user, remember);
        }
      })
    );
  }

  exchangeGoogleToken(idToken: string): Observable<GoogleLoginResponse> {
    const request: GoogleLoginRequest = { idToken };
    return this.http.post<GoogleLoginResponse>(
      this.baseUrl + API.AUTH.GOOGLE,
      request
    );
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

  private getFirebaseAuth(): Auth {
    if (this.firebaseAuth) {
      return this.firebaseAuth;
    }

    const config = environment.firebase;
    if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
      throw new Error('Firebase Google sign-in is not configured.');
    }

    const app: FirebaseApp = getApps().length
      ? getApp()
      : initializeApp(config);
    this.firebaseAuth = getAuth(app);
    return this.firebaseAuth;
  }
}
