import { Routes } from '@angular/router';

import { authGuard } from './core/serivce/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./static/dashboard/dashboard').then(({ Dashboard }) => Dashboard),
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
