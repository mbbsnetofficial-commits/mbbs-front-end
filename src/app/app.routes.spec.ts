import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from './app.routes';
import { NotFoundComponent } from './shared/components/not-found/not-found';

describe('App Routes', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    });
    router = TestBed.inject(Router);
  });

  it('should ensure the wildcard (**) route is the LAST route in the list', () => {
    const lastRoute = routes[routes.length - 1];
    expect(lastRoute.path).toBe('**');
  });

  it('should ensure the wildcard route lazy-loads NotFoundComponent', async () => {
    const wildcardRoute = routes.find((r) => r.path === '**');
    expect(wildcardRoute).toBeTruthy();
    expect(wildcardRoute?.loadComponent).toBeDefined();

    if (wildcardRoute?.loadComponent) {
      const comp = await (wildcardRoute.loadComponent as any)();
      expect(comp).toBe(NotFoundComponent);
    }
  });

  it('should navigate to NotFoundComponent for an unmatched route', async () => {
    await router.navigateByUrl('/this-route-does-not-exist-at-all');
    expect(router.url).toBe('/this-route-does-not-exist-at-all');
  });

  it('should redirect /login to /auth/login', async () => {
    await router.navigateByUrl('/login');
    expect(router.url).toBe('/auth/login');
  });

  it('should redirect /register to /auth/register', async () => {
    await router.navigateByUrl('/register');
    expect(router.url).toBe('/auth/register');
  });

  it('should redirect /otp to /auth/otp', async () => {
    await router.navigateByUrl('/otp');
    expect(router.url).toBe('/auth/otp');
  });
});
