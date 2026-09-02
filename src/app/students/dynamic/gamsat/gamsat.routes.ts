import { Routes } from '@angular/router';

export const gamsatRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/learning-report/learning-report').then(
        ({ GamsatLearningReport }) => GamsatLearningReport
      )
  },
  {
    path: 'quick-test',
    loadComponent: () =>
      import('./components/quick-test/quick-test').then(
        ({ GamsatQuickTest }) => GamsatQuickTest
      )
  },
  {
    path: 'practice',
    loadComponent: () =>
      import('./components/gamsat-practice/gamsat-practice').then(
        ({ GamsatPractice }) => GamsatPractice
      )
  },
  {
    path: 'previous-year',
    loadComponent: () =>
      import('./components/gamsat-previous-year/gamsat-previous-year').then(
        ({ GamsatPreviousYear }) => GamsatPreviousYear
      )
  },
  {
    path: 'previous-year-tests',
    redirectTo: 'previous-year'
  }
];
