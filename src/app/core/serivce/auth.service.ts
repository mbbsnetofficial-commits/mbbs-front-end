import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environments';
import { API } from '../constants/api.constants';
import {
  RegisterRequest,
  VerifyOtpRequest,
  LoginRequest
} from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = environment.apiBaseUrl;

  constructor(
    private http: HttpClient
  ) { }

  register(data: RegisterRequest) {
    return this.http.post(
      this.baseUrl + API.AUTH.REGISTER,
      data
    );
  }

  verifyOtp(data: VerifyOtpRequest) {
    return this.http.post(
      this.baseUrl + API.AUTH.VERIFY_OTP,
      data
    );
  }

  login(data: LoginRequest) {
    return this.http.post(
      this.baseUrl + API.AUTH.LOGIN,
      data
    );
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