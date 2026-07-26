import { Routes } from '@angular/router';

import { authGuard } from './core/serivce/auth.guard';
import { Dashboard } from './static/dashboard/dashboard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: Dashboard,
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
