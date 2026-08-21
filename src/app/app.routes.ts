import { Routes } from '@angular/router';

import { authGuard } from './students/auth/services/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./students/static/dashboard/dashboard').then(({ Dashboard }) => Dashboard),
  },
  {
    path: 'blogs',
    loadChildren: () =>
      import('./students/static/blogs/blogs.routes').then((m) => m.blogRoutes),
  },
  {
    path: 'static',
    loadChildren: () =>
      import('./students/static/static.routes').then((m) => m.staticRoutes),
  },
  {
    path: 'auth',
    loadChildren: () => import('./students/auth/auth.routes').then((m) => m.authRoutes),
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
      import('./students/dynamic/dynamic.routes').then((m) => m.dynamicRoutes),
  },
  {
    path: 'university',
    loadChildren: () =>
      import('./universities/university.routes').then((m) => m.universityRoutes),
  },
  {
    path: 'universities',
    loadChildren: () =>
      import('./universities/university.routes').then((m) => m.universityRoutes),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
