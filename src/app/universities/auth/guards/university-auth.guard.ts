import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { UniversityAuthService } from '../services/university-auth.service';

/**
 * UniversityAuthGuard protects authenticated University routes (e.g. /university/dashboard).
 * If the user is authenticated via UniversityAuthService, access is granted.
 * Otherwise, redirects to the University Sign In page (/university/auth/login).
 */
export const universityAuthGuard: CanMatchFn = () => {
  const authService = inject(UniversityAuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/university/auth/login']);
};
