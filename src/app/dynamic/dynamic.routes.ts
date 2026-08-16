import { Routes } from '@angular/router';

export const dynamicRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../layouts/dynamic-layouts/dynamic-layouts').then(
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
        loadChildren: () =>
          import('./blogs/blogs.routes').then(({ blogRoutes }) => blogRoutes),
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('./chat/student-chat').then(({ StudentChat }) => StudentChat),
      },
      {
        path: 'ai-chat',
        loadComponent: () =>
          import('./ai-chat/ai-chat').then(({ AiChat }) => AiChat),
      },
      {
        path: 'ucat',
        loadChildren: () =>
          import('./ucat/ucat.routes').then(({ ucatRoutes }) => ucatRoutes),
      },
      {
        path: 'cse',
        loadChildren: () =>
          import('./cse/cse.routes').then(({ cseRoutes }) => cseRoutes),
      },
      {
        path: 'neet',
        loadChildren: () =>
          import('./neet/neet.routes').then(({ neetRoutes }) => neetRoutes),
      },
    ],
  },
];
