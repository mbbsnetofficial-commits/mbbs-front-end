import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { environment } from '../../../../environments/environment';
import { API } from '../constants/api.constants';

describe('AuthService', () => {
  let service: AuthService;
  let httpTestingController: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        TokenService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should post to /auth/sign-up on register()', () => {
    const mockReq = { fullName: 'Sanjay', phoneNumber: '+919444308959' };
    const mockRes = {
      status: 'success',
      message: "We've sent a verification code.",
      data: { phoneNumber: '+919444308959', expiresInMinutes: 5 }
    };

    service.register(mockReq).subscribe((res) => {
      expect(res).toEqual(mockRes);
    });

    const req = httpTestingController.expectOne(baseUrl + API.AUTH.SIGN_UP);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockReq);
    req.flush(mockRes);
  });

  it('should post to /auth/login on requestLoginOtp()', () => {
    const mockReq = { phoneNumber: '+919444308959' };
    const mockRes = {
      status: 'success',
      message: "We've sent a verification code.",
      data: { phoneNumber: '+919444308959', expiresInMinutes: 5 }
    };

    service.requestLoginOtp(mockReq).subscribe((res) => {
      expect(res).toEqual(mockRes);
    });

    const req = httpTestingController.expectOne(baseUrl + API.AUTH.LOGIN);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockReq);
    req.flush(mockRes);
  });

  it('should post to /auth/login/verify-otp on verifyLoginOtp()', () => {
    const mockReq = { phoneNumber: '+919444308959', otp: '4827' };
    const mockRes = {
      status: 'success',
      message: 'Login successful.',
      data: {
        accessToken: 'mock_jwt_access',
        refreshToken: 'mock_jwt_refresh',
        student_id: 'student_1'
      }
    };

    service.verifyLoginOtp(mockReq).subscribe((res) => {
      expect(res).toEqual(mockRes);
    });

    const req = httpTestingController.expectOne(baseUrl + API.AUTH.VERIFY_LOGIN_OTP);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockReq);
    req.flush(mockRes);
  });

  it('should post to /auth/resend-otp on resendOtp()', () => {
    const mockReq = { phoneNumber: '+919444308959', purpose: 'login' as const };
    const mockRes = {
      status: 'success',
      message: 'OTP resent.',
      data: { phoneNumber: '+919444308959', expiresInMinutes: 5 }
    };

    service.resendOtp(mockReq).subscribe((res) => {
      expect(res).toEqual(mockRes);
    });

    const req = httpTestingController.expectOne(baseUrl + API.AUTH.RESEND_OTP);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockReq);
    req.flush(mockRes);
  });

  it('should post to /auth/refresh-token on refreshToken()', () => {
    const mockRes = {
      status: 'success',
      data: {
        accessToken: 'new_access',
        refreshToken: 'new_refresh'
      }
    };

    service.refreshToken('old_refresh').subscribe((res) => {
      expect(res).toEqual(mockRes);
    });

    const req = httpTestingController.expectOne(baseUrl + API.AUTH.REFRESH_TOKEN);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'old_refresh' });
    req.flush(mockRes);
  });

  it('should post to /auth/logout on logout()', () => {
    service.logout().subscribe((res) => {
      expect(res).toBeDefined();
    });

    const req = httpTestingController.expectOne(baseUrl + API.AUTH.LOGOUT);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Logged out successfully.' });
  });
});
