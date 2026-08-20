import { Routes } from '@angular/router';

export const invitesRoutes: Routes = [
  {
    path: '',
    title: 'University Invites | MBBS.NET',
    loadComponent: () =>
      import('./components/invites/student-invites/student-invites.component').then(
        ({ StudentInvitesComponent }) => StudentInvitesComponent
      ),
  },
  {
    path: ':inviteId',
    title: 'Invitation Details | MBBS.NET',
    loadComponent: () =>
      import('./components/invites/invite-details/invite-details.component').then(
        ({ InviteDetailsComponent }) => InviteDetailsComponent
      ),
  },
];

export const profileRoutes: Routes = [
  {
    path: '',
    title: 'Student Profile & Preferences | MBBS.NET',
    loadComponent: () =>
      import('./components/profile/student-profile/student-profile.component').then(
        ({ StudentProfileComponent }) => StudentProfileComponent
      ),
  },
];

export const admissionsRoutes: Routes = [
  {
    path: 'invites',
    children: invitesRoutes,
  },
  {
    path: 'profile',
    children: profileRoutes,
  },
  {
    path: '',
    redirectTo: 'invites',
    pathMatch: 'full',
  },
];
