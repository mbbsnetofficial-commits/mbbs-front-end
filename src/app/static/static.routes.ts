import { Routes } from '@angular/router';
import { StaticLayout } from '../layouts/static-layout/static-layout';
import { Dashboard } from './dashboard/dashboard';

export const staticRoutes: Routes = [
  {
    path: '',
    component: StaticLayout,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        component: Dashboard,
      },
    ],
  },
];