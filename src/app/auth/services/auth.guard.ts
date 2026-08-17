import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

import { TokenService } from './token.service';

export const authGuard: CanMatchFn = () => {

  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (tokenService.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};
