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
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/student-dashboard').then(
            ({ StudentDashboard }) => StudentDashboard
          ),
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('./chat/student-chat').then(
            ({ StudentChat }) => StudentChat
          ),
      },
      {
        path: 'blogs',
        loadChildren: () =>
          import('./blogs/blogs.routes').then(({ blogRoutes }) => blogRoutes),
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
        path: 'neet/quick-test',
        loadComponent: () =>
          import('./neet/quick-test/quick-test').then(
            ({ QuickTest }) => QuickTest
          ),
      },
      {
        path: 'neet/previous-year-tests',
        loadComponent: () =>
          import('./neet/previous-year-questions/previous-year-questions').then(
            ({ PreviousYearQuestions }) => PreviousYearQuestions
          ),
      },
      {
        path: 'neet/leaderboard',
        loadComponent: () =>
          import('./neet/test-leaderboard/test-leaderboard').then(
            ({ TestLeaderboard }) => TestLeaderboard
          ),
      },
      {
        path: 'neet',
        loadComponent: () =>
          import('./neet/neet').then(({ NeetComponent }) => NeetComponent),
      },
    ],
  },
];
