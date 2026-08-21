import { Routes } from '@angular/router';
import { universityAuthGuard } from './auth/guards/university-auth.guard';

export const universityRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'auth/login',
    title: 'University Sign In | MBBS.NET',
    loadComponent: () =>
      import('./auth/components/university-login/university-login').then(
        (m) => m.UniversityLoginComponent
      ),
  },
  {
    path: 'auth/reset-password',
    title: 'University Reset Password | MBBS.NET',
    loadComponent: () =>
      import('./auth/components/reset-password/reset-password').then(
        (m) => m.ResetPasswordComponent
      ),
  },
  {
    path: 'dashboard',
    canMatch: [universityAuthGuard],
    title: 'University Dashboard | MBBS.NET',
    loadComponent: () =>
      import('./dashboard/university-dashboard').then(
        (m) => m.UniversityDashboardComponent
      ),
  },
  {
    path: 'students',
    canMatch: [universityAuthGuard],
    title: 'Candidate Students | MBBS.NET',
    loadComponent: () =>
      import(
        './students/components/university-students/university-students'
      ).then((m) => m.UniversityStudentsComponent),
  },
  {
    path: 'students/:studentId',
    canMatch: [universityAuthGuard],
    title: 'Candidate Profile | MBBS.NET',
    loadComponent: () =>
      import(
        './students/components/university-student-detail/university-student-detail'
      ).then((m) => m.UniversityStudentDetailComponent),
  },
  {
    path: 'invites',
    canMatch: [universityAuthGuard],
    title: 'Sent Invitations | MBBS.NET',
    loadComponent: () =>
      import(
        './invites/components/university-invites/university-invites'
      ).then((m) => m.UniversityInvitesComponent),
  },
  {
    path: 'templates',
    canMatch: [universityAuthGuard],
    title: 'Offer Templates | MBBS.NET',
    loadComponent: () =>
      import(
        './templates/components/university-templates/university-templates'
      ).then((m) => m.UniversityTemplatesComponent),
  },
  {
    path: 'notifications',
    canMatch: [universityAuthGuard],
    title: 'Notifications | MBBS.NET',
    loadComponent: () =>
      import(
        './notifications/components/university-notifications/university-notifications'
      ).then((m) => m.UniversityNotificationsComponent),
  },
  {
    path: 'profile',
    canMatch: [universityAuthGuard],
    title: 'Organization Profile | MBBS.NET',
    loadComponent: () =>
      import(
        './profile/components/university-profile/university-profile'
      ).then((m) => m.UniversityProfileComponent),
  },
];
