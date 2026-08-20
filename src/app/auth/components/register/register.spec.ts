import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Register } from './register';
import { AuthService } from '../../services/auth.service';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    await fixture.whenStable();
  }, 30000);

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate full name and phone number', () => {
    component['registerForm'].controls.fullName.setValue('Sanjay Kumar');
    component['registerForm'].controls.whatsappNumber.setValue('9876543210');
    component['registerForm'].controls.termsAccepted.setValue(true);
    expect(component['registerForm'].valid).toBe(true);

    component['registerForm'].controls.whatsappNumber.setValue('12');
    expect(component['registerForm'].invalid).toBe(true);
  });

  it('should call register API and navigate to OTP on success', () => {
    const registerSpy = vi.spyOn(authService, 'register').mockReturnValue(
      of({
        status: 'success',
        message: "We've sent a verification code to your WhatsApp.",
        data: { phoneNumber: '+919876543210', expiresInMinutes: 5 }
      })
    );
    const routerSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component['registerForm'].controls.fullName.setValue('Sanjay Kumar');
    component['registerForm'].controls.countryCode.setValue('+91');
    component['registerForm'].controls.whatsappNumber.setValue('9876543210');
    component['registerForm'].controls.termsAccepted.setValue(true);

    component['register']();

    expect(registerSpy).toHaveBeenCalledWith({
      fullName: 'Sanjay Kumar',
      phoneNumber: '+919876543210'
    });
    expect(sessionStorage.getItem('pendingVerificationPhone')).toBe('+919876543210');
    expect(sessionStorage.getItem('pendingAuthPurpose')).toBe('register');
    expect(routerSpy).toHaveBeenCalledWith(['/auth/otp']);
  });

  it('should display error message on registration failure', () => {
    vi.spyOn(authService, 'register').mockReturnValue(
      throwError(() => ({
        error: { message: 'This mobile number is already registered. Please log in.' }
      }))
    );

    component['registerForm'].controls.fullName.setValue('Sanjay Kumar');
    component['registerForm'].controls.countryCode.setValue('+91');
    component['registerForm'].controls.whatsappNumber.setValue('9876543210');
    component['registerForm'].controls.termsAccepted.setValue(true);

    component['register']();

    expect(component['errorMessage']()).toBe('This mobile number is already registered. Please log in.');
  });
});
