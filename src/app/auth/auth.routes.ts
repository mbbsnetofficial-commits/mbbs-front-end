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
      import('./login/login').then(({ Login }) => Login),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./register/register').then(({ Register }) => Register),
  },
  {
    path: 'otp',
    loadComponent: () =>
      import('./otp/otp').then(({ Otp }) => Otp),
  },
];
