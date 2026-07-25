import { Routes } from '@angular/router';

import { DynamicLayouts } from '../layouts/dynamic-layouts/dynamic-layouts';
import { Dashboard } from './dashboard/dashboard';
import { NeetComponent } from './neet/neet';
import { PreviousYearQuestions } from './neet/previous-year-questions/previous-year-questions';
import { QuickTest } from './neet/quick-test/quick-test';
import { TestLeaderboard } from './neet/test-leaderboard/test-leaderboard';

export const dynamicRoutes: Routes = [
  {
    path: '',
    component: DynamicLayouts,
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
      {
        path: 'neet/quick-test',
        component: QuickTest,
      },
      {
        path: 'neet/previous-year-tests',
        component: PreviousYearQuestions,
      },
      {
        path: 'neet/leaderboard',
        component: TestLeaderboard,
      },
      {
        path: 'neet',
        component: NeetComponent,
      },
    ],
  },
];
