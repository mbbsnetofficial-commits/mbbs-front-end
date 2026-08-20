import { Routes } from '@angular/router';

import { authGuard } from './auth/services/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./static/dashboard/dashboard').then(({ Dashboard }) => Dashboard),
  },
  {
    path: 'blogs',
    loadChildren: () =>
      import('./static/blogs/blogs.routes').then((m) => m.blogRoutes),
  },
  {
    path: 'static',
    loadChildren: () =>
      import('./static/static.routes').then((m) => m.staticRoutes),
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'student/invites',
    redirectTo: '/dynamic/invites',
  },
  {
    path: 'student/profile',
    redirectTo: '/dynamic/profile',
  },
  {
    path: 'student/admissions',
    redirectTo: '/dynamic/invites',
  },
  {
    path: 'dynamic',
    canMatch: [authGuard],
    loadChildren: () =>
      import('./dynamic/dynamic.routes').then((m) => m.dynamicRoutes),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
