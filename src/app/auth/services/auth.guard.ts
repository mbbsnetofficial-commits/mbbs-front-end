import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';

export const authGuard: CanMatchFn = () => {
  if (environment.authGuardEnabled === false) {
    return true;
  }

  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (tokenService.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};
