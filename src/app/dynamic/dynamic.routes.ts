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
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard').then(({ Dashboard }) => Dashboard),
      },
      {
        path: 'blogs/:slug',
        loadComponent: () =>
          import('./blogs/blog-detail/blog-detail').then(
            ({ BlogDetail }) => BlogDetail
          ),
      },
      {
        path: 'blogs',
        data: { view: 'blogs' },
        loadComponent: () =>
          import('./student-space/student-space').then(
            ({ StudentSpace }) => StudentSpace
          ),
      },
      {
        path: 'categories',
        data: { view: 'categories' },
        loadComponent: () =>
          import('./student-space/student-space').then(
            ({ StudentSpace }) => StudentSpace
          ),
      },
      {
        path: 'authors',
        data: { view: 'authors' },
        loadComponent: () =>
          import('./student-space/student-space').then(
            ({ StudentSpace }) => StudentSpace
          ),
      },
      {
        path: 'bookmarks',
        data: { view: 'bookmarks' },
        loadComponent: () =>
          import('./student-space/student-space').then(
            ({ StudentSpace }) => StudentSpace
          ),
      },
      {
        path: 'activity',
        data: { view: 'activity' },
        loadComponent: () =>
          import('./student-space/student-space').then(
            ({ StudentSpace }) => StudentSpace
          ),
      },
      {
        path: 'profile',
        data: { view: 'profile' },
        loadComponent: () =>
          import('./student-space/student-space').then(
            ({ StudentSpace }) => StudentSpace
          ),
      },
      {
        path: 'settings',
        data: { view: 'settings' },
        loadComponent: () =>
          import('./student-space/student-space').then(
            ({ StudentSpace }) => StudentSpace
          ),
      },
      {
        path: 'performance',
        redirectTo: 'neet/leaderboard',
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
