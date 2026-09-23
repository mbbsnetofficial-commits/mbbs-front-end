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
    path: 'terms-and-conditions',
    loadComponent: () =>
      import('./layouts/static-layout/static-layout').then(
        ({ StaticLayout }) => StaticLayout
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Terms of Service | MBBS.NET',
        loadComponent: () =>
          import(
            './students/static/legal/terms-and-conditions/terms-and-conditions'
          ).then((m) => m.TermsAndConditionsComponent),
      },
    ],
  },
  {
    path: 'terms-and-condition',
    redirectTo: '/terms-and-conditions',
    pathMatch: 'full',
  },
  {
    path: 'terms',
    redirectTo: '/terms-and-conditions',
    pathMatch: 'full',
  },
  {
    path: 'privacy-policy',
    loadComponent: () =>
      import('./layouts/static-layout/static-layout').then(
        ({ StaticLayout }) => StaticLayout
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Privacy & Data Policy | MBBS.NET',
        loadComponent: () =>
          import('./students/static/legal/privacy-policy/privacy-policy').then(
            (m) => m.PrivacyPolicyComponent
          ),
      },
    ],
  },
  {
    path: 'privacy',
    redirectTo: '/privacy-policy',
    pathMatch: 'full',
  },
  {
    path: 'delete-account',
    loadComponent: () =>
      import('./layouts/static-layout/static-layout').then(
        ({ StaticLayout }) => StaticLayout
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Account & Data Deletion | MBBS.NET',
        loadComponent: () =>
          import('./students/static/legal/delete-account/delete-account').then(
            (m) => m.DeleteAccountComponent
          ),
      },
    ],
  },
  {
    path: 'account-deletion',
    redirectTo: '/delete-account',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () => import('./students/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'login',
    redirectTo: '/auth/login',
    pathMatch: 'full',
  },
  {
    path: 'signin',
    redirectTo: '/auth/login',
    pathMatch: 'full',
  },
  {
    path: 'register',
    redirectTo: '/auth/register',
    pathMatch: 'full',
  },
  {
    path: 'signup',
    redirectTo: '/auth/register',
    pathMatch: 'full',
  },
  {
    path: 'otp',
    redirectTo: '/auth/otp',
    pathMatch: 'full',
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
    title: '404 - Page Not Found | MBBS.NET',
    loadComponent: () =>
      import('./shared/components/not-found/not-found').then(
        (m) => m.NotFoundComponent
      ),
  },
];
