import { Routes } from '@angular/router';

export const dynamicRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../layouts/dynamic-layouts/dynamic-layouts').then(
        ({ DynamicLayouts }) => DynamicLayouts
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'neet',
      },
      {
        path: 'performance',
        redirectTo: 'neet/leaderboard',
      },

      {
        path: 'blogs',
        redirectTo: '/blogs',
      },
      {
        path: 'ai-chat',
        loadComponent: () =>
          import('./ai-chat/ai-chat').then(({ AiChat }) => AiChat),
      },
      {
        path: 'invites',
        loadChildren: () =>
          import('./admissions/admissions.routes').then(({ invitesRoutes }) => invitesRoutes),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./admissions/admissions.routes').then(({ profileRoutes }) => profileRoutes),
      },
      {
        path: 'admissions',
        redirectTo: 'invites',
      },
      {
        path: 'ucat',
        loadChildren: () =>
          import('./ucat/ucat.routes').then(({ ucatRoutes }) => ucatRoutes),
      },
      {
        path: 'neet',
        loadChildren: () =>
          import('./neet/neet.routes').then(({ neetRoutes }) => neetRoutes),
      },
      {
        path: 'gamsat',
        loadChildren: () =>
          import('./gamsat/gamsat.routes').then(({ gamsatRoutes }) => gamsatRoutes),
      },
    ],
  },
];
