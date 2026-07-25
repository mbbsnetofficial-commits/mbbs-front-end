import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';
import { Otp } from './otp/otp';

export const authRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'register',
    component: Register,
  },
  {
    path: 'otp',
    component: Otp
  }
];
