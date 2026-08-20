import { Routes } from '@angular/router';
export const staticRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/',
  },
  {
    path: 'dashboard',
    redirectTo: '/',
  },
  {
    path: 'blogs',
    loadChildren: () =>
      import('./blogs/blogs.routes').then((m) => m.blogRoutes),
  },
];
