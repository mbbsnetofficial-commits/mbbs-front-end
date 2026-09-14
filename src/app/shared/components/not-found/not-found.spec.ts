import { Location } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NotFoundComponent } from './not-found';

describe('NotFoundComponent', () => {
  let component: NotFoundComponent;
  let fixture: ComponentFixture<NotFoundComponent>;
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    fixture.detectChanges();
  });

  it('should create NotFoundComponent successfully', () => {
    expect(component).toBeTruthy();
  });

  it('should render the "404" dominant numerical typography', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const num404 = compiled.querySelector('.num-404');
    expect(num404).toBeTruthy();
    expect(num404?.textContent?.trim()).toBe('404');
    expect(num404?.getAttribute('aria-label')).toBe('Error 404');
  });

  it('should display the eyebrow 404 badge tag', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('.eyebrow-badge');
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toContain('404 ERROR');
  });

  it('should render the exact required main heading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('.error-heading');
    expect(heading).toBeTruthy();
    expect(heading?.textContent?.trim()).toBe(
      "Looks like you've taken a wrong turn."
    );
  });

  it('should render the exact supporting paragraph text', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const desc = compiled.querySelector('.error-desc');
    expect(desc).toBeTruthy();
    expect(desc?.textContent?.trim()).toBe(
      "The page you're looking for doesn't exist or may have moved. Let's get you back on track."
    );
  });

  it('should render the brand reassurance note', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const note = compiled.querySelector('.reassurance-note');
    expect(note).toBeTruthy();
    expect(note?.textContent).toContain('Your medical journey is still on track.');
  });

  it('should render accessible "Go Back" and "Go Home" buttons with action icons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const btnBack = compiled.querySelector('.btn-back') as HTMLButtonElement;
    const btnHome = compiled.querySelector('.btn-home') as HTMLButtonElement;

    expect(btnBack).toBeTruthy();
    expect(btnBack.tagName.toLowerCase()).toBe('button');
    expect(btnBack.getAttribute('aria-label')).toBe('Go Back to previous page');
    expect(btnBack.textContent).toContain('Go Back');

    expect(btnHome).toBeTruthy();
    expect(btnHome.tagName.toLowerCase()).toBe('button');
    expect(btnHome.getAttribute('aria-label')).toBe('Go Home to MBBS.NET');
    expect(btnHome.textContent).toContain('Go Home');
  });

  it('should call router.navigate(["/"]) when "Go Home" button is clicked', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    const btnHome = (fixture.nativeElement as HTMLElement).querySelector(
      '.btn-home'
    ) as HTMLButtonElement;

    btnHome.click();
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('should invoke goBack() when "Go Back" button is clicked', () => {
    const goBackSpy = vi.spyOn(component, 'goBack');
    const btnBack = (fixture.nativeElement as HTMLElement).querySelector(
      '.btn-back'
    ) as HTMLButtonElement;

    btnBack.click();
    expect(goBackSpy).toHaveBeenCalled();
  });

  it('should ensure background particle canvas and characters track have aria-hidden="true"', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const canvas = compiled.querySelector('.particle-canvas');
    const charactersTrack = compiled.querySelector('.characters-track');

    expect(canvas?.getAttribute('aria-hidden')).toBe('true');
    expect(charactersTrack?.getAttribute('aria-hidden')).toBe('true');
  });
});
