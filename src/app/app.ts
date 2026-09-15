import { Component, inject, signal, OnDestroy } from '@angular/core';
import {
  Router,
  RouterOutlet,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError
} from '@angular/router';
import { Subscription } from 'rxjs';
import { LogoLoader } from './shared/ui/logo-loader/logo-loader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LogoLoader],
  templateUrl: './app.html',
  styles: [`
    .route-progress-bar {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      z-index: 999999;
      pointer-events: none;
      background: #e6e8ec;
      overflow: hidden;
    }
    .route-progress-bar::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 40%;
      background: linear-gradient(90deg, #d4f83c, #061e19);
      box-shadow: 0 0 10px rgba(227, 254, 84, 0.75);
      animation: routeScan 1.1s cubic-bezier(0.65, 0, 0.35, 1) infinite;
    }
    @keyframes routeScan {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(260%); }
    }
    @media (prefers-reduced-motion: reduce) {
      .route-progress-bar::after {
        animation: none;
      }
    }
  `]
})
export class App implements OnDestroy {
  private readonly router = inject(Router, { optional: true });
  readonly isNavigating = signal<boolean>(false);
  readonly showOverlay = signal<boolean>(false);
  private overlayTimer: any = null;
  private navSub: Subscription | null = null;

  constructor() {
    if (!this.router) return;

    this.navSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isNavigating.set(true);
        this.overlayTimer = setTimeout(() => {
          if (this.isNavigating()) {
            this.showOverlay.set(true);
          }
        }, 260);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.isNavigating.set(false);
        this.showOverlay.set(false);
        if (this.overlayTimer) {
          clearTimeout(this.overlayTimer);
          this.overlayTimer = null;
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.overlayTimer) {
      clearTimeout(this.overlayTimer);
    }
    this.navSub?.unsubscribe();
  }
}
