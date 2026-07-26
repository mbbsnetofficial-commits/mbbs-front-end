import { Component } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import { AuthService } from '../../core/serivce/auth.service';
import { TokenService } from '../../core/serivce/token.service';

@Component({
  selector: 'app-dynamic-layouts',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  templateUrl: './dynamic-layouts.html',
  styleUrl: './dynamic-layouts.scss'
})
export class DynamicLayouts {

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router
  ) {}

  onLogout() {
    this.authService.logout().subscribe({
      next: () => {
        this.tokenService.clearTokens();
        this.router.navigate(['/']);
      },

      error: () => {
        this.tokenService.clearTokens();
        this.router.navigate(['/']);
      }
    });
  }

}
