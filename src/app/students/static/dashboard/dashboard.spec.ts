import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { By } from '@angular/platform-browser';

import { Dashboard } from './dashboard';

describe('Dashboard Navigation', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([]), provideHttpClient()],
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

  it('should render Universities Directory Panel when universities mega-menu is active', () => {
    (component as any).openMegaMenu('universities');
    fixture.detectChanges();

    const directoryPanel = fixture.debugElement.query(By.css('.universities-directory-panel'));
    expect(directoryPanel).toBeTruthy();

    const titleEl = directoryPanel.query(By.css('.panel-main-title'));
    expect(titleEl.nativeElement.textContent).toContain('All universities at a glance');
  });

  describe('Scroll-Driven Journey Section (Section 2)', () => {
    it('should render section 2 header with "Choose your path." and supporting line', () => {
      const guidanceSection = fixture.debugElement.query(By.css('#guidance'));
      expect(guidanceSection).toBeTruthy();

      const eyebrow = guidanceSection.query(By.css('.journey-eyebrow'));
      expect(eyebrow.nativeElement.textContent?.trim()).toBe('YOUR JOURNEY');

      const heading = guidanceSection.query(By.css('.journey-heading'));
      expect(heading.nativeElement.textContent?.trim()).toBe('Choose your path.');

      const subheading = guidanceSection.query(By.css('.journey-subheading'));
      expect(subheading.nativeElement.textContent?.trim()).toBe('Explore. Prepare. Apply.');
    });

    it('should render all three pathway stages with correct concise copy and CTAs', () => {
      const stages = fixture.debugElement.queryAll(By.css('.pathway-stage'));
      expect(stages.length).toBe(3);

      // Stage 01: EXPLORE
      expect(stages[0].query(By.css('.stage-number')).nativeElement.textContent?.trim()).toBe('01');
      expect(stages[0].query(By.css('.stage-category')).nativeElement.textContent?.trim()).toBe('EXPLORE');
      expect(stages[0].query(By.css('.stage-title')).nativeElement.textContent?.trim()).toBe('Find your university');
      expect(stages[0].query(By.css('.stage-desc')).nativeElement.textContent?.trim()).toBe('Discover and compare medical universities.');
      expect(stages[0].query(By.css('.stage-cta')).nativeElement.getAttribute('href')).toBe('#destinations');

      // Stage 02: PREPARE
      expect(stages[1].query(By.css('.stage-number')).nativeElement.textContent?.trim()).toBe('02');
      expect(stages[1].query(By.css('.stage-category')).nativeElement.textContent?.trim()).toBe('PREPARE');
      expect(stages[1].query(By.css('.stage-title')).nativeElement.textContent?.trim()).toBe('Get exam ready');
      expect(stages[1].query(By.css('.stage-desc')).nativeElement.textContent?.trim()).toBe('Prepare for NEET, UCAT and GAMSAT.');
      expect(stages[1].query(By.css('.stage-cta')).nativeElement.getAttribute('href')).toBe('/auth/register');

      // Stage 03: APPLY
      expect(stages[2].query(By.css('.stage-number')).nativeElement.textContent?.trim()).toBe('03');
      expect(stages[2].query(By.css('.stage-category')).nativeElement.textContent?.trim()).toBe('APPLY');
      expect(stages[2].query(By.css('.stage-title')).nativeElement.textContent?.trim()).toBe('Plan your admission');
      expect(stages[2].query(By.css('.stage-desc')).nativeElement.textContent?.trim()).toBe('Understand requirements and move toward admission.');
      expect(stages[2].query(By.css('.stage-cta')).nativeElement.getAttribute('href')).toBe('#contact');
    });

    it('should set Stage 01 as active while stages 02 & 03 remain visible but inactive at step 1', () => {
      (component as any).activeJourneyStep.set(1);
      fixture.detectChanges();

      const stages = fixture.debugElement.queryAll(By.css('.pathway-stage'));
      expect(stages[0].nativeElement.classList.contains('is-active')).toBe(true);
      expect(stages[0].nativeElement.classList.contains('is-passed')).toBe(false);

      expect(stages[1].nativeElement.classList.contains('is-active')).toBe(false);
      expect(stages[1].nativeElement.classList.contains('is-passed')).toBe(false);

      expect(stages[2].nativeElement.classList.contains('is-active')).toBe(false);
      expect(stages[2].nativeElement.classList.contains('is-passed')).toBe(false);
    });

    it('should set Stage 01 as passed, Stage 02 as active (featured), and Stage 03 as inactive at step 2', () => {
      (component as any).activeJourneyStep.set(2);
      fixture.detectChanges();

      const stages = fixture.debugElement.queryAll(By.css('.pathway-stage'));
      expect(stages[0].nativeElement.classList.contains('is-passed')).toBe(true);
      expect(stages[0].nativeElement.classList.contains('is-active')).toBe(false);

      expect(stages[1].nativeElement.classList.contains('is-active')).toBe(true);
      expect(stages[1].nativeElement.classList.contains('featured')).toBe(true);
      expect(stages[1].nativeElement.classList.contains('is-passed')).toBe(false);

      expect(stages[2].nativeElement.classList.contains('is-active')).toBe(false);
      expect(stages[2].nativeElement.classList.contains('is-passed')).toBe(false);
    });

    it('should set Stages 01 & 02 as passed, and Stage 03 as active at step 3', () => {
      (component as any).activeJourneyStep.set(3);
      fixture.detectChanges();

      const stages = fixture.debugElement.queryAll(By.css('.pathway-stage'));
      expect(stages[0].nativeElement.classList.contains('is-passed')).toBe(true);
      expect(stages[0].nativeElement.classList.contains('is-active')).toBe(false);

      expect(stages[1].nativeElement.classList.contains('is-passed')).toBe(true);
      expect(stages[1].nativeElement.classList.contains('is-active')).toBe(false);

      expect(stages[2].nativeElement.classList.contains('is-active')).toBe(true);
      expect(stages[2].nativeElement.classList.contains('is-passed')).toBe(false);
    });
  });
});
