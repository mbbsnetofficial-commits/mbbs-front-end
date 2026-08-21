import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

import { Dashboard } from './dashboard';

describe('Dashboard Navigation', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  }, 30000);

  it('should create Dashboard component', () => {
    expect(component).toBeTruthy();
  });

  it('should render University Portal in the primary navbar navigating to /university/auth/login', () => {
    const navbarPortalLink = fixture.debugElement.query(
      By.css('.header-actions .univ-portal-link')
    );

    expect(navbarPortalLink).toBeTruthy();
    expect(navbarPortalLink.nativeElement.textContent).toContain('University Portal');
    expect(navbarPortalLink.nativeElement.getAttribute('href')).toBe('/university/auth/login');
  });

  it('should position University Portal immediately before Student Log in in the header actions', () => {
    const headerActionLinks = fixture.debugElement.queryAll(By.css('.header-actions a'));
    expect(headerActionLinks.length).toBe(3);

    const [portalLink, loginLink, registerLink] = headerActionLinks;

    expect(portalLink.nativeElement.textContent).toContain('University Portal');
    expect(portalLink.nativeElement.getAttribute('href')).toBe('/university/auth/login');

    expect(loginLink.nativeElement.textContent?.trim()).toBe('Log in');
    expect(loginLink.nativeElement.getAttribute('href')).toBe('/auth/login');

    expect(registerLink.nativeElement.textContent).toContain('Create account');
    expect(registerLink.nativeElement.getAttribute('href')).toBe('/auth/register');
  });

  it('should maintain Student "Log in" link navigating to /auth/login', () => {
    const loginLink = fixture.debugElement
      .queryAll(By.css('.header-actions a'))
      .find((el) => el.nativeElement.textContent?.trim() === 'Log in');

    expect(loginLink).toBeTruthy();
    expect(loginLink?.nativeElement.getAttribute('href')).toBe('/auth/login');
  });

  it('should maintain Student "Create account" link navigating to /auth/register', () => {
    const registerLink = fixture.debugElement
      .queryAll(By.css('.header-actions a'))
      .find((el) => el.nativeElement.textContent?.includes('Create account'));

    expect(registerLink).toBeTruthy();
    expect(registerLink?.nativeElement.getAttribute('href')).toBe('/auth/register');
  });

  it('should NOT contain University Portal in the Universities dropdown/mega-menu', () => {
    // Open universities mega menu
    (component as any).openMegaMenu('universities');
    fixture.detectChanges();

    const megaLinks = fixture.debugElement.queryAll(By.css('.mega-links a'));
    const dropdownPortalLink = megaLinks.find((el) =>
      el.nativeElement.textContent?.includes('University Portal')
    );

    expect(dropdownPortalLink).toBeUndefined();

    // Verify standard discovery links remain intact
    const linkTexts = megaLinks.map((el) => el.nativeElement.textContent?.trim());
    expect(linkTexts).toContain('Explore Universities');
    expect(linkTexts).toContain('Study MBBS Abroad');
    expect(linkTexts).toContain('University Recognition');
  });

  it('should render University Portal entry in the footer navigating to /university/auth/login', () => {
    const footerPortalLink = fixture.debugElement
      .queryAll(By.css('.site-footer a'))
      .find((el) => el.nativeElement.textContent?.includes('University Portal'));

    expect(footerPortalLink).toBeTruthy();
    expect(footerPortalLink?.nativeElement.getAttribute('href')).toBe('/university/auth/login');
  });
});
