import { TestBed } from '@angular/core/testing';
import { Route, UrlSegment, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { TokenService } from './token.service';
import { environment } from '../../../../environments/environment';

describe('authGuard', () => {
  let tokenService: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TokenService],
    });

    tokenService = TestBed.inject(TokenService);
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Reset to development default
    environment.authGuardEnabled = false;
  });

  it('should allow access immediately when authGuardEnabled is false (development mode)', () => {
    environment.authGuardEnabled = false;
    tokenService.clearTokens();

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as Route, [] as UrlSegment[])
    );

    expect(result).toBe(true);
  });

  it('should allow access when authGuardEnabled is true and user is logged in (production mode)', () => {
    environment.authGuardEnabled = true;
    tokenService.saveTokens('mock_access', 'mock_refresh', 'mock_student', true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as Route, [] as UrlSegment[])
    );

    expect(result).toBe(true);
  });

  it('should redirect to /auth/login when authGuardEnabled is true and user is not logged in', () => {
    environment.authGuardEnabled = true;
    tokenService.clearTokens();

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as Route, [] as UrlSegment[])
    );

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/auth/login');
  });
});
