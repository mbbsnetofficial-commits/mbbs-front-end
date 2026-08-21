import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UNIVERSITY_STORAGE_KEYS } from '../constants/university-auth.constants';
import {
  ResetPasswordResponse,
  UniversityAuthResponse,
} from '../models/university-auth.model';
import { UniversityAuthService } from './university-auth.service';

describe('UniversityAuthService', () => {
  let service: UniversityAuthService;
  let httpTesting: HttpTestingController;
  const baseUrl = environment.universityApiBaseUrl;

  const mockIdentity = {
    id: 'ORG_TSMU_001',
    organizationId: 'ORG_TSMU_001',
    name: 'Tbilisi State Medical University',
    code: 'TSMU',
    email: 'admissions@tsmu.edu',
    role: 'UNIVERSITY_ADMIN',
    country: 'Georgia',
    city: 'Tbilisi',
    logo: 'https://example.com/tsmu-logo.png',
  };

  const mockLoginResponse: UniversityAuthResponse = {
    success: true,
    message: 'University login successful',
    data: {
      token: 'mock-univ-jwt-token-12345',
      university: mockIdentity,
    },
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UniversityAuthService,
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
    service = TestBed.inject(UniversityAuthService);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  describe('Login API (POST /university/auth/login)', () => {
    it('should send POST request to /university/auth/login with credentials and save session', async () => {
      const payload = {
        email: 'admissions@tsmu.edu',
        password: 'YourPassword123!',
      };

      const loginPromise = firstValueFrom(service.login(payload));

      const req = httpTesting.expectOne(`${baseUrl}/university/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockLoginResponse);

      const res = await loginPromise;
      expect(res.success).toBe(true);
      expect(service.getToken()).toBe('mock-univ-jwt-token-12345');
      expect(service.currentUser()?.name).toBe(
        'Tbilisi State Medical University'
      );
      expect(service.isAuthenticated()).toBe(true);
      expect(localStorage.getItem(UNIVERSITY_STORAGE_KEYS.ACCESS_TOKEN)).toBe(
        'mock-univ-jwt-token-12345'
      );
    });

    it('should handle 400 MISSING_CREDENTIALS error', async () => {
      const payload = { email: '', password: '' };
      const loginPromise = firstValueFrom(service.login(payload));

      const req = httpTesting.expectOne(`${baseUrl}/university/auth/login`);
      req.flush(
        { success: false, message: 'Missing credentials' },
        { status: 400, statusText: 'Bad Request' }
      );

      try {
        await loginPromise;
      } catch (err: any) {
        expect(err.status).toBe(400);
      }

      expect(service.error()).toBe('Missing credentials');
      expect(service.isAuthenticated()).toBe(false);
      expect(service.loading()).toBe(false);
    });

    it('should handle 401 INVALID_CREDENTIALS error', async () => {
      const payload = {
        email: 'admissions@tsmu.edu',
        password: 'WrongPassword',
      };
      const loginPromise = firstValueFrom(service.login(payload));

      const req = httpTesting.expectOne(`${baseUrl}/university/auth/login`);
      req.flush(
        { success: false, message: 'Invalid credentials' },
        { status: 401, statusText: 'Unauthorized' }
      );

      try {
        await loginPromise;
      } catch (err: any) {
        expect(err.status).toBe(401);
      }

      expect(service.error()).toBe('Invalid credentials');
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should handle 403 ACCOUNT_SUSPENDED error', async () => {
      const payload = {
        email: 'suspended@tsmu.edu',
        password: 'Password123!',
      };
      const loginPromise = firstValueFrom(service.login(payload));

      const req = httpTesting.expectOne(`${baseUrl}/university/auth/login`);
      req.flush(
        { success: false, message: 'Account is suspended' },
        { status: 403, statusText: 'Forbidden' }
      );

      try {
        await loginPromise;
      } catch (err: any) {
        expect(err.status).toBe(403);
      }

      expect(service.error()).toBe('Account is suspended');
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should handle 403 PORTAL_ACCESS_DISABLED error', async () => {
      const payload = {
        email: 'disabled@tsmu.edu',
        password: 'Password123!',
      };
      const loginPromise = firstValueFrom(service.login(payload));

      const req = httpTesting.expectOne(`${baseUrl}/university/auth/login`);
      req.flush(
        { success: false, message: 'Portal access is disabled' },
        { status: 403, statusText: 'Forbidden' }
      );

      try {
        await loginPromise;
      } catch (err: any) {
        expect(err.status).toBe(403);
      }

      expect(service.error()).toBe('Portal access is disabled');
    });

    it('should handle 500 server error on login', async () => {
      const payload = {
        email: 'admissions@tsmu.edu',
        password: 'Password123!',
      };
      const loginPromise = firstValueFrom(service.login(payload));

      const req = httpTesting.expectOne(`${baseUrl}/university/auth/login`);
      req.flush(
        { success: false, message: 'Internal server error' },
        { status: 500, statusText: 'Server Error' }
      );

      try {
        await loginPromise;
      } catch (err: any) {
        expect(err.status).toBe(500);
      }

      expect(service.error()).toBe('Internal server error');
    });
  });

  describe('Reset Password API (POST /university/auth/reset-password)', () => {
    it('should send POST to /university/auth/reset-password with token and newPassword', async () => {
      const payload = {
        token: 'token-abc-999',
        newPassword: 'NewSecurePassword2026!',
      };
      const mockResponse: ResetPasswordResponse = {
        success: true,
        message:
          'Password reset successful. Please log in with your new password.',
      };

      const promise = firstValueFrom(service.resetPassword(payload));

      const req = httpTesting.expectOne(
        `${baseUrl}/university/auth/reset-password`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);

      const res = await promise;
      expect(res.success).toBe(true);
      expect(service.loading()).toBe(false);
    });

    it('should handle 400 WEAK_PASSWORD error', async () => {
      const payload = { token: 'token-abc-999', newPassword: '123' };
      const promise = firstValueFrom(service.resetPassword(payload));

      const req = httpTesting.expectOne(
        `${baseUrl}/university/auth/reset-password`
      );
      req.flush(
        { success: false, message: 'Password is too weak' },
        { status: 400, statusText: 'Bad Request' }
      );

      try {
        await promise;
      } catch (err: any) {
        expect(err.status).toBe(400);
      }

      expect(service.error()).toBe('Password is too weak');
    });

    it('should handle 400 INVALID_RESET_TOKEN error', async () => {
      const payload = {
        token: 'expired-token',
        newPassword: 'NewPassword123!',
      };
      const promise = firstValueFrom(service.resetPassword(payload));

      const req = httpTesting.expectOne(
        `${baseUrl}/university/auth/reset-password`
      );
      req.flush(
        { success: false, message: 'Invalid or expired reset token' },
        { status: 400, statusText: 'Bad Request' }
      );

      try {
        await promise;
      } catch (err: any) {
        expect(err.status).toBe(400);
      }

      expect(service.error()).toBe('Invalid or expired reset token');
    });
  });

  describe('Logout API (POST /university/auth/logout)', () => {
    it('should send POST request to /university/auth/logout with University Bearer token and clear session', async () => {
      service.setSession('univ-token-999', mockIdentity);
      expect(service.isAuthenticated()).toBe(true);

      const logoutPromise = firstValueFrom(service.logout());

      const req = httpTesting.expectOne(`${baseUrl}/university/auth/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer univ-token-999'
      );
      expect(req.request.body).toEqual({});

      req.flush({
        success: true,
        message: 'University logged out successfully. Session has been revoked.',
        data: {
          organizationId: 'ORG_TSMU_001',
          revokedAt: '2026-08-21T11:00:00.000Z',
        },
      });

      const res = await logoutPromise;
      expect(res.success).toBe(true);
      expect(service.getToken()).toBeNull();
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(
        localStorage.getItem(UNIVERSITY_STORAGE_KEYS.ACCESS_TOKEN)
      ).toBeNull();
      expect(localStorage.getItem(UNIVERSITY_STORAGE_KEYS.IDENTITY)).toBeNull();
    });

    it('should clear local session and handle 401 token missing error', async () => {
      service.setSession('expired-token', mockIdentity);

      const logoutPromise = firstValueFrom(service.logout());

      const req = httpTesting.expectOne(`${baseUrl}/university/auth/logout`);
      req.flush(
        { status: 'fail', message: 'Token missing. Please login.' },
        { status: 401, statusText: 'Unauthorized' }
      );

      const res = await logoutPromise;
      expect(res.success).toBe(false);
      expect(service.getToken()).toBeNull();
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should clear local session when backend returns 401 SESSION_NOT_FOUND', async () => {
      service.setSession('revoked-token', mockIdentity);

      const logoutPromise = firstValueFrom(service.logout());

      const req = httpTesting.expectOne(`${baseUrl}/university/auth/logout`);
      req.flush(
        {
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Session not found or already revoked.',
          },
        },
        { status: 401, statusText: 'Unauthorized' }
      );

      const res = await logoutPromise;
      expect(res.success).toBe(false);
      expect(service.getToken()).toBeNull();
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should not clear Student tokens when University logout occurs', async () => {
      // Simulate existing student tokens
      localStorage.setItem('accessToken', 'student-access-token');
      localStorage.setItem('refreshToken', 'student-refresh-token');
      localStorage.setItem('studentId', 'STU_001');

      service.setSession('univ-token', mockIdentity);

      const logoutPromise = firstValueFrom(service.logout());

      const req = httpTesting.expectOne(`${baseUrl}/university/auth/logout`);
      req.flush({ success: true, message: 'Logged out' });

      await logoutPromise;

      // University session cleared
      expect(service.getToken()).toBeNull();

      // Student session preserved
      expect(localStorage.getItem('accessToken')).toBe('student-access-token');
      expect(localStorage.getItem('refreshToken')).toBe('student-refresh-token');
      expect(localStorage.getItem('studentId')).toBe('STU_001');
    });

    it('should prevent duplicate in-flight logout requests', () => {
      service.setSession('univ-token', mockIdentity);

      service.logout().subscribe();
      service.logout().subscribe();

      // Only one HTTP call is generated
      const reqs = httpTesting.match(`${baseUrl}/university/auth/logout`);
      expect(reqs.length).toBe(1);
      reqs[0].flush({ success: true, message: 'Logged out' });
    });
  });
});
