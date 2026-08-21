import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UniversityAuthService } from '../../services/university-auth.service';
import { UniversityLoginComponent } from './university-login';

describe('UniversityLoginComponent', () => {
  let component: UniversityLoginComponent;
  let fixture: ComponentFixture<UniversityLoginComponent>;
  let authServiceMock: Partial<UniversityAuthService>;
  let router: Router;

  beforeEach(async () => {
    authServiceMock = {
      login: vi.fn().mockReturnValue(
        of({
          success: true,
          data: {
            token: 'test-token',
            university: {
              id: 'U1',
              organizationId: 'U1',
              name: 'Test Univ',
              code: 'TU',
              email: 'admin@tu.edu',
              role: 'ADMIN',
              country: 'Georgia',
              city: 'Tbilisi',
            },
          },
        })
      ),
      loading: vi.fn().mockReturnValue(false) as any,
      error: vi.fn().mockReturnValue(null) as any,
    };

    await TestBed.configureTestingModule({
      imports: [UniversityLoginComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: UniversityAuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(UniversityLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }, 30000);

  it('should create UniversityLoginComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should require email and password before calling login API', () => {
    component.email = '';
    component.password = '';
    component.onSubmit();

    expect(authServiceMock.login).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('Please provide both');
  });

  it('should call authService.login and navigate on success', () => {
    component.email = 'admissions@tsmu.edu';
    component.password = 'Password123!';
    component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: 'admissions@tsmu.edu',
      password: 'Password123!',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/university/dashboard']);
  });

  it('should display error message on login failure', () => {
    (authServiceMock.login as any).mockReturnValue(
      throwError(() => ({
        error: { message: 'Invalid university email or password.' },
        status: 401,
      }))
    );

    component.email = 'admissions@tsmu.edu';
    component.password = 'WrongPass';
    component.onSubmit();

    expect(component.errorMessage()).toBe('Invalid university email or password.');
  });

  it('should render "Back to MBBS.NET" link navigating to /', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const backLink = compiled.querySelector('a.back-link');

    expect(backLink).toBeTruthy();
    expect(backLink?.textContent).toContain('Back to MBBS.NET');
    expect(backLink?.getAttribute('href')).toBe('/');
  });
});
