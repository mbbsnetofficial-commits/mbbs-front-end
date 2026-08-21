import { Routes } from '@angular/router';
import { PageStore } from './state/page.store';

export const blogRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../../layouts/static-layout/static-layout').then(
        ({ StaticLayout }) => StaticLayout
      ),
    providers: [PageStore],
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Medical Blog | MBBS.NET',
        loadComponent: () =>
          import('./pages/home/home').then(({ BlogHome }) => BlogHome)
      },
      {
        path: ':slug',
        title: 'Blog | MBBS.NET',
        loadComponent: () =>
          import('./pages/blog-detail/blog-detail').then(
            ({ BlogDetail }) => BlogDetail
          )
      },
      {
        path: ':slug/comments',
        title: 'Comments | MBBS.NET',
        loadComponent: () =>
          import('./pages/comments-page/comments-page').then(
            ({ CommentsPage }) => CommentsPage
          )
      }
    ]
  }
];
