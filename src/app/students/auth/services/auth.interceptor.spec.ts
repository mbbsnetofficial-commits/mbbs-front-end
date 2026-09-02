import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { authInterceptor, isStudentApiRequest } from './auth.interceptor';
import { TokenService } from './token.service';

describe('AuthInterceptor Domain Isolation', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let tokenService: TokenService;
  let router: Router;

  const mockStudentAccessToken = 'mock-student-access-jwt-token';
  const mockStudentRefreshToken = 'mock-student-refresh-token';

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        TokenService,
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    tokenService = TestBed.inject(TokenService);
    router = TestBed.inject(Router);

    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    // Populate active Student session
    tokenService.saveTokens(
      mockStudentAccessToken,
      mockStudentRefreshToken,
      'STUDENT_123'
    );
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('isStudentApiRequest URL predicate', () => {
    it('should return true for core student API URLs', () => {
      expect(
        isStudentApiRequest(`${environment.apiBaseUrl}/neet/questions`)
      ).toBe(true);
      expect(
        isStudentApiRequest(`${environment.apiBaseUrl}/ucat/practice`)
      ).toBe(true);
      expect(isStudentApiRequest(`${environment.apiBaseUrl}/blogs`)).toBe(true);
      expect(isStudentApiRequest(`${environment.apiBaseUrl}/auth/login`)).toBe(
        true
      );
    });

    it('should return true for student admissions API URLs', () => {
      expect(
        isStudentApiRequest(
          `${environment.admissionsApiBaseUrl}/student/profile`
        )
      ).toBe(true);
      expect(
        isStudentApiRequest(
          `${environment.admissionsApiBaseUrl}/student/invites`
        )
      ).toBe(true);
      expect(
        isStudentApiRequest(
          `${environment.admissionsApiBaseUrl}/student/invites/inv-101`
        )
      ).toBe(true);
    });

    it('should return true for GAMSAT student API URLs on api2.mbbs.net', () => {
      expect(
        isStudentApiRequest(
          `${environment.gamsatApiBaseUrl}/gamsat/test/start`
        )
      ).toBe(true);
      expect(
        isStudentApiRequest(
          `${environment.gamsatApiBaseUrl}/gamsat/previous-year-tests/paper-1/start`
        )
      ).toBe(true);
      expect(
        isStudentApiRequest(
          `${environment.gamsatApiBaseUrl}/gamsat/test/submit`
        )
      ).toBe(true);
      expect(
        isStudentApiRequest(
          `${environment.gamsatApiBaseUrl}/gamsat/test/sessions/sess-1`
        )
      ).toBe(true);
    });

    it('should return false for University API URLs', () => {
      expect(
        isStudentApiRequest(
          `${environment.universityApiBaseUrl}/university/auth/login`
        )
      ).toBe(false);
      expect(
        isStudentApiRequest(
          `${environment.universityApiBaseUrl}/university/auth/logout`
        )
      ).toBe(false);
      expect(
        isStudentApiRequest(
          `${environment.universityApiBaseUrl}/university/auth/reset-password`
        )
      ).toBe(false);
      expect(
        isStudentApiRequest(
          `${environment.universityApiBaseUrl}/university/dashboard`
        )
      ).toBe(false);
    });

    it('should return false for external or public asset URLs', () => {
      expect(isStudentApiRequest('https://cdn.example.com/images/logo.png')).toBe(
        false
      );
      expect(isStudentApiRequest('https://api.github.com/users')).toBe(false);
      expect(isStudentApiRequest('')).toBe(false);
    });
  });

  describe('TEST 1: Student Core API Request', () => {
    it('should attach Student Authorization Bearer token to GET https://api.mbbs.net/api/v1/neet/...', async () => {
      const url = `${environment.apiBaseUrl}/neet/questions`;
      const responsePromise = firstValueFrom(http.get(url));

      const req = httpTesting.expectOne(url);
      expect(req.request.headers.get('Authorization')).toBe(
        `Bearer ${mockStudentAccessToken}`
      );
      req.flush({ success: true, data: [] });

      const res = await responsePromise;
      expect(res).toBeTruthy();
    });
  });

  describe('TEST 2: Student Admissions Profile API', () => {
    it('should attach Student Authorization Bearer token to GET https://api2.mbbs.net/api/v1/student/profile', async () => {
      const url = `${environment.admissionsApiBaseUrl}/student/profile`;
      const responsePromise = firstValueFrom(http.get(url));

      const req = httpTesting.expectOne(url);
      expect(req.request.headers.get('Authorization')).toBe(
        `Bearer ${mockStudentAccessToken}`
      );
      req.flush({ success: true, data: {} });

      const res = await responsePromise;
      expect(res).toBeTruthy();
    });
  });

  describe('TEST 3: Student Invites API', () => {
    it('should attach Student Authorization Bearer token to GET https://api2.mbbs.net/api/v1/student/invites', async () => {
      const url = `${environment.admissionsApiBaseUrl}/student/invites`;
      const responsePromise = firstValueFrom(http.get(url));

      const req = httpTesting.expectOne(url);
      expect(req.request.headers.get('Authorization')).toBe(
        `Bearer ${mockStudentAccessToken}`
      );
      req.flush({ success: true, data: { invites: [] } });

      const res = await responsePromise;
      expect(res).toBeTruthy();
    });
  });

  describe('TEST 4: University Login API', () => {
    it('should NOT attach Student Authorization header to POST /university/auth/login', async () => {
      const url = `${environment.universityApiBaseUrl}/university/auth/login`;
      const payload = {
        email: 'admissions@tsmu.edu',
        password: 'Password123!',
      };
      const responsePromise = firstValueFrom(http.post(url, payload));

      const req = httpTesting.expectOne(url);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({ success: true, data: { token: 'univ-token' } });

      const res = await responsePromise;
      expect(res).toBeTruthy();
    });
  });

  describe('TEST 5: University Logout API', () => {
    it('should NOT attach Student Authorization header to POST /university/auth/logout', async () => {
      const url = `${environment.universityApiBaseUrl}/university/auth/logout`;
      const responsePromise = firstValueFrom(http.post(url, {}));

      const req = httpTesting.expectOne(url);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({ success: true, message: 'Logged out' });

      const res = await responsePromise;
      expect(res).toBeTruthy();
    });
  });

  describe('TEST 6: University Reset Password API', () => {
    it('should NOT attach Student Authorization header to POST /university/auth/reset-password', async () => {
      const url = `${environment.universityApiBaseUrl}/university/auth/reset-password`;
      const payload = { token: 'tok-123', newPassword: 'NewPassword2026!' };
      const responsePromise = firstValueFrom(http.post(url, payload));

      const req = httpTesting.expectOne(url);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({ success: true, message: 'Password reset' });

      const res = await responsePromise;
      expect(res).toBeTruthy();
    });
  });

  describe('TEST 7: University 401 Isolation', () => {
    it('should pass University 401 error through WITHOUT triggering Student refresh, clearing tokens, or navigating to /auth/login', async () => {
      const url = `${environment.universityApiBaseUrl}/university/auth/login`;
      const payload = { email: 'wrong@tsmu.edu', password: 'bad' };

      const responsePromise = firstValueFrom(http.post(url, payload));

      const req = httpTesting.expectOne(url);
      expect(req.request.headers.has('Authorization')).toBe(false);

      // Simulate 401 error on University API
      req.flush(
        { success: false, message: 'Invalid university credentials' },
        { status: 401, statusText: 'Unauthorized' }
      );

      try {
        await responsePromise;
      } catch (err: any) {
        expect(err.status).toBe(401);
      }

      // Verify no Student refresh request was made
      httpTesting.expectNone(
        `${environment.apiBaseUrl}/auth/refresh-token`
      );

      // Verify Student session is NOT cleared
      expect(tokenService.getAccessToken()).toBe(mockStudentAccessToken);
      expect(tokenService.getRefreshToken()).toBe(mockStudentRefreshToken);

      // Verify router did NOT navigate to Student login
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('TEST 8: Student 401 Refresh & Retry', () => {
    it('should intercept Student 401, execute refresh-token flow, and retry original Student request', async () => {
      const url = `${environment.admissionsApiBaseUrl}/student/profile`;
      const responsePromise = firstValueFrom(http.get(url));

      // 1. Initial request with old token
      const initialReq = httpTesting.expectOne(url);
      expect(initialReq.request.headers.get('Authorization')).toBe(
        `Bearer ${mockStudentAccessToken}`
      );
      initialReq.flush(
        { message: 'Token expired' },
        { status: 401, statusText: 'Unauthorized' }
      );

      // 2. Interceptor triggers Student token refresh
      const refreshReq = httpTesting.expectOne(
        `${environment.apiBaseUrl}/auth/refresh-token`
      );
      expect(refreshReq.request.body).toEqual({
        refreshToken: mockStudentRefreshToken,
      });

      const newAccessToken = 'new-refreshed-student-jwt';
      const newRefreshToken = 'new-refreshed-student-refresh';
      refreshReq.flush({
        status: 'success',
        message: 'Token refreshed',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });

      // 3. Original request retried with new token
      const retryReq = httpTesting.expectOne(url);
      expect(retryReq.request.headers.get('Authorization')).toBe(
        `Bearer ${newAccessToken}`
      );
      retryReq.flush({ success: true, data: { personal: { fullName: 'Alex' } } });

      const res: any = await responsePromise;
      expect(res.data.personal.fullName).toBe('Alex');
      expect(tokenService.getAccessToken()).toBe(newAccessToken);
    });
  });

  describe('TEST 9: Student Refresh Failure', () => {
    it('should clear Student tokens and navigate to /auth/login when Student refresh fails', async () => {
      const url = `${environment.apiBaseUrl}/neet/questions`;
      const responsePromise = firstValueFrom(http.get(url));

      // 1. Initial request fails with 401
      const initialReq = httpTesting.expectOne(url);
      initialReq.flush(
        { message: 'Session expired' },
        { status: 401, statusText: 'Unauthorized' }
      );

      // 2. Refresh request also fails with 401
      const refreshReq = httpTesting.expectOne(
        `${environment.apiBaseUrl}/auth/refresh-token`
      );
      refreshReq.flush(
        { message: 'Invalid refresh token' },
        { status: 401, statusText: 'Unauthorized' }
      );

      try {
        await responsePromise;
      } catch (err) {
        expect(err).toBeTruthy();
      }

      // 3. Tokens cleared and redirected to /auth/login
      expect(tokenService.getAccessToken()).toBeNull();
      expect(tokenService.getRefreshToken()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('TEST 10: Non-API / Public / External Requests', () => {
    it('should NOT attach Student Authorization header or handle refresh for external requests', async () => {
      const externalUrl = 'https://cdn.example.com/assets/banner.jpg';
      const responsePromise = firstValueFrom(http.get(externalUrl));

      const req = httpTesting.expectOne(externalUrl);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush('image-binary-data');

      const res = await responsePromise;
      expect(res).toBe('image-binary-data');
    });
  });
});
