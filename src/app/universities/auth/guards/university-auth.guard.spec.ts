import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { universityAuthGuard } from './university-auth.guard';
import { UniversityAuthService } from '../services/university-auth.service';

describe('universityAuthGuard', () => {
  let authServiceMock: { isAuthenticated: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(() => {
    authServiceMock = {
      isAuthenticated: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: UniversityAuthService, useValue: authServiceMock },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('should allow access when University user is authenticated', () => {
    authServiceMock.isAuthenticated.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      universityAuthGuard({} as any, [])
    );

    expect(result).toBe(true);
  });

  it('should redirect to /university/auth/login when University user is NOT authenticated', () => {
    authServiceMock.isAuthenticated.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      universityAuthGuard({} as any, [])
    );

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/university/auth/login');
  });
});
