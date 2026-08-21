import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UniversityAuthService } from '../../services/university-auth.service';
import { ResetPasswordComponent } from './reset-password';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let authServiceMock: Partial<UniversityAuthService>;

  beforeEach(async () => {
    authServiceMock = {
      resetPassword: vi.fn().mockReturnValue(
        of({
          success: true,
          message: 'Password reset successful. Please log in with your new password.',
        })
      ),
      loading: vi.fn().mockReturnValue(false) as any,
      error: vi.fn().mockReturnValue(null) as any,
    };

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'token' ? 'query-token-123' : null),
              },
            },
          },
        },
        { provide: UniversityAuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }, 30000);

  it('should create ResetPasswordComponent and extract token from query params', () => {
    expect(component).toBeTruthy();
    expect(component.token).toBe('query-token-123');
  });

  it('should validate password length and confirmation match', () => {
    component.token = 'valid-token';
    component.newPassword = 'short';
    component.confirmPassword = 'short';
    component.onSubmit();

    expect(authServiceMock.resetPassword).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('at least 8 characters');

    component.newPassword = 'Password123!';
    component.confirmPassword = 'DifferentPassword123!';
    component.onSubmit();

    expect(authServiceMock.resetPassword).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('confirmation does not match');
  });

  it('should call resetPassword API with token and newPassword on valid submit', () => {
    component.token = 'query-token-123';
    component.newPassword = 'NewSecurePassword2026!';
    component.confirmPassword = 'NewSecurePassword2026!';
    component.onSubmit();

    expect(authServiceMock.resetPassword).toHaveBeenCalledWith({
      token: 'query-token-123',
      newPassword: 'NewSecurePassword2026!',
    });
    expect(component.successMessage()).toContain('Password reset successful');
  });

  it('should handle reset password API failure', () => {
    (authServiceMock.resetPassword as any).mockReturnValue(
      throwError(() => ({
        error: { message: 'Invalid or expired reset token' },
        status: 400,
      }))
    );

    component.token = 'invalid-token';
    component.newPassword = 'NewSecurePassword2026!';
    component.confirmPassword = 'NewSecurePassword2026!';
    component.onSubmit();

    expect(component.errorMessage()).toBe('Invalid or expired reset token');
  });
});
