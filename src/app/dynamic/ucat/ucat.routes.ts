import { Routes } from '@angular/router';

export const ucatRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/ucat-practice/ucat-practice').then(
        ({ UcatPractice }) => UcatPractice
      )
  },
  {
    path: 'previous-year',
    loadComponent: () =>
      import('./components/ucat-previous-year/ucat-previous-year').then(
        ({ UcatPreviousYear }) => UcatPreviousYear
      )
  },
  {
    path: 'previous-year-tests',
    redirectTo: 'previous-year'
  }
];
