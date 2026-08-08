import { Routes } from '@angular/router';

import { CseService } from './services/cse.service';
import { CseStore } from './state/cse.store';

export const cseRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'country-selection',
      },
      {
        path: 'country-selection',
        title: 'Select Country | MBBS.NET CSE',
        loadComponent: () =>
          import('./pages/country-selection/country-selection').then(
            ({ CountrySelection }) => CountrySelection
          ),
      },
      {
        path: 'questionnaire',
        title: 'Eligibility & Preference Quiz | MBBS.NET CSE',
        loadComponent: () =>
          import('./pages/questionnaire/questionnaire').then(
            ({ Questionnaire }) => Questionnaire
          ),
      },
      {
        path: 'questions',
        title: 'Eligibility & Preference Quiz | MBBS.NET CSE',
        loadComponent: () =>
          import('./pages/questionnaire/questionnaire').then(
            ({ Questionnaire }) => Questionnaire
          ),
      },
      {
        path: 'student-details',
        title: 'Student Profile | MBBS.NET CSE',
        loadComponent: () =>
          import('./pages/student-details/student-details').then(
            ({ StudentDetails }) => StudentDetails
          ),
      },
      {
        path: 'recommendations',
        title: 'Your University Recommendations | MBBS.NET CSE',
        loadComponent: () =>
          import('./pages/recommendations/recommendations').then(
            ({ Recommendations }) => Recommendations
          ),
      },
      {
        path: 'university-details/:id',
        title: 'University Profile | MBBS.NET CSE',
        loadComponent: () =>
          import('./pages/university-details/university-details').then(
            ({ UniversityDetails }) => UniversityDetails
          ),
      },
      {
        path: 'university-details',
        title: 'University Profile | MBBS.NET CSE',
        loadComponent: () =>
          import('./pages/university-details/university-details').then(
            ({ UniversityDetails }) => UniversityDetails
          ),
      },
    ],
  },
];
