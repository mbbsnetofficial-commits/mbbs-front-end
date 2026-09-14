import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    title: 'Student Sign In | MBBS.NET',
    loadComponent: () =>
      import('./components/login/login').then(({ Login }) => Login),
  },
  {
    path: 'signin',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'register',
    title: 'Create Account | MBBS.NET',
    loadComponent: () =>
      import('./components/register/register').then(({ Register }) => Register),
  },
  {
    path: 'signup',
    redirectTo: 'register',
    pathMatch: 'full',
  },
  {
    path: 'otp',
    title: 'Verify OTP | MBBS.NET',
    loadComponent: () =>
      import('./components/otp/otp').then(({ Otp }) => Otp),
  },
];
