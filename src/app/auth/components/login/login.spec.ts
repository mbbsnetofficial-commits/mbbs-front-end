import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Login } from './login';
import { AuthService } from '../../services/auth.service';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate 10-digit phone number correctly', () => {
    component['loginForm'].controls.whatsappNumber.setValue('9876543210');
    expect(component['loginForm'].valid).toBe(true);

    component['loginForm'].controls.whatsappNumber.setValue('123');
    expect(component['loginForm'].invalid).toBe(true);
  });

  it('should call requestLoginOtp and navigate to OTP on success', () => {
    const requestLoginSpy = vi.spyOn(authService, 'requestLoginOtp').mockReturnValue(
      of({
        status: 'success',
        message: "We've sent a verification code to your WhatsApp.",
        data: { phoneNumber: '+919876543210', expiresInMinutes: 5 }
      })
    );
    const routerSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component['loginForm'].controls.countryCode.setValue('+91');
    component['loginForm'].controls.whatsappNumber.setValue('9876543210');

    component['login']();

    expect(requestLoginSpy).toHaveBeenCalledWith({ phoneNumber: '+919876543210' });
    expect(sessionStorage.getItem('pendingVerificationPhone')).toBe('+919876543210');
    expect(sessionStorage.getItem('pendingAuthPurpose')).toBe('login');
    expect(routerSpy).toHaveBeenCalledWith(['/auth/otp']);
  });

  it('should display error message on API failure', () => {
    vi.spyOn(authService, 'requestLoginOtp').mockReturnValue(
      throwError(() => ({
        error: { message: 'Invalid phone number format.' }
      }))
    );

    component['loginForm'].controls.countryCode.setValue('+91');
    component['loginForm'].controls.whatsappNumber.setValue('9876543210');

    component['login']();

    expect(component['errorMessage']()).toBe('Invalid phone number format.');
  });
});
