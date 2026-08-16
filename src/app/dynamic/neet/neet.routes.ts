import { Routes } from '@angular/router';

export const neetRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/learning-report/learning-report').then(
        ({ LearningReport }) => LearningReport
      )
  },
  {
    path: 'quick-test',
    loadComponent: () =>
      import('./components/quick-test/quick-test').then(
        ({ QuickTest }) => QuickTest
      )
  },
  {
    path: 'previous-year-tests',
    loadComponent: () =>
      import('./components/previous-year/previous-year').then(
        ({ PreviousYear }) => PreviousYear
      )
  },
  {
    path: 'previous-year',
    redirectTo: 'previous-year-tests'
  },
  {
    path: 'leaderboard',
    loadComponent: () =>
      import('./components/test-leaderboard/test-leaderboard').then(
        ({ TestLeaderboard }) => TestLeaderboard
      )
  }
];
