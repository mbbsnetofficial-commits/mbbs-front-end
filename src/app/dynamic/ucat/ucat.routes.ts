import { Routes } from '@angular/router';

export const ucatRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/ucat-practice/ucat-practice').then(
        ({ UcatPractice }) => UcatPractice
      )
  },
  {
    path: 'previous-year',
    loadComponent: () =>
      import('./pages/ucat-previous-year/ucat-previous-year').then(
        ({ UcatPreviousYear }) => UcatPreviousYear
      )
  }
];
