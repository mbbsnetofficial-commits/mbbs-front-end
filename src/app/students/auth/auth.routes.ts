import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login').then(({ Login }) => Login),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register').then(({ Register }) => Register),
  },
  {
    path: 'otp',
    loadComponent: () =>
      import('./components/otp/otp').then(({ Otp }) => Otp),
  },
];
