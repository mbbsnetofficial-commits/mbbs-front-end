import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Otp } from './otp';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../services/token.service';

describe('Otp', () => {
  let component: Otp;
  let fixture: ComponentFixture<Otp>;
  let authService: AuthService;
  let tokenService: TokenService;
  let router: Router;

  beforeEach(async () => {
    sessionStorage.setItem('pendingVerificationPhone', '+919444308959');
    sessionStorage.setItem('pendingFormattedPhone', '+91 94443 08959');
    sessionStorage.setItem('pendingFullName', 'Sanjay Kumar');
    sessionStorage.setItem('pendingAuthPurpose', 'login');

    await TestBed.configureTestingModule({
      imports: [Otp],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Otp);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    tokenService = TestBed.inject(TokenService);
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should verify login OTP and store tokens on success', () => {
    const verifySpy = vi.spyOn(authService, 'verifyLoginOtp').mockReturnValue(
      of({
        status: 'success',
        message: 'Login successful.',
        data: {
          accessToken: 'test_access_jwt',
          refreshToken: 'test_refresh_jwt',
          student_id: 'student_123',
          user: {
            id: 'u123',
            student_id: 'student_123',
            fullName: 'Sanjay Kumar',
            email: 'sanjay@example.com'
          }
        }
      })
    );
    const saveTokensSpy = vi.spyOn(tokenService, 'saveTokens');
    const saveUserSpy = vi.spyOn(tokenService, 'saveUser');
    const routerSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component['verificationForm'].controls.otp.setValue('4827');
    component['verifyOtp']();

    expect(verifySpy).toHaveBeenCalledWith({
      phoneNumber: '+919444308959',
      otp: '4827'
    });
    expect(saveTokensSpy).toHaveBeenCalledWith('test_access_jwt', 'test_refresh_jwt', 'student_123', true);
    expect(saveUserSpy).toHaveBeenCalled();
    expect(routerSpy).toHaveBeenCalledWith(['/dynamic/neet']);
  });

  it('should verify registration OTP when purpose is register', () => {
    component['authPurpose'].set('register');
    const verifyRegSpy = vi.spyOn(authService, 'verifyRegisterOtp').mockReturnValue(
      of({
        status: 'success',
        message: 'Account created successfully.',
        data: {
          accessToken: 'reg_access_jwt',
          refreshToken: 'reg_refresh_jwt',
          student_id: 'student_456'
        }
      })
    );
    const routerSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component['verificationForm'].controls.otp.setValue('1234');
    component['verifyOtp']();

    expect(verifyRegSpy).toHaveBeenCalledWith({
      phoneNumber: '+919444308959',
      otp: '1234'
    });
    expect(routerSpy).toHaveBeenCalledWith(['/dynamic/neet']);
  });

  it('should handle verification error message', () => {
    vi.spyOn(authService, 'verifyLoginOtp').mockReturnValue(
      throwError(() => ({
        error: { message: 'Incorrect verification code. Please try again.' }
      }))
    );

    component['verificationForm'].controls.otp.setValue('0000');
    component['verifyOtp']();

    expect(component['errorMessage']()).toBe('Incorrect verification code. Please try again.');
  });

  it('should resend OTP when requested', () => {
    component['timerSeconds'].set(0);
    const resendSpy = vi.spyOn(authService, 'resendOtp').mockReturnValue(
      of({
        status: 'success',
        message: "We've resent a verification code to your WhatsApp.",
        data: { phoneNumber: '+919444308959', expiresInMinutes: 5 }
      })
    );

    component['resendCode']();

    expect(resendSpy).toHaveBeenCalledWith({
      phoneNumber: '+919444308959',
      purpose: 'login'
    });
    expect(component['successMessage']()).toBe("We've resent a verification code to your WhatsApp.");
  });
});
