import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LogoLoader } from './logo-loader.component';

describe('LogoLoader', () => {
  let component: LogoLoader;
  let fixture: ComponentFixture<LogoLoader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoLoader],
    }).compileComponents();

    fixture = TestBed.createComponent(LogoLoader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render MBBS logo image with correct src', () => {
    fixture.detectChanges();
    const img: HTMLImageElement = fixture.nativeElement.querySelector('.logo-img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('/images/app-logo.png');
    expect(img.getAttribute('alt')).toBe('MBBS.NET Logo');
  });

  it('should render message when provided', () => {
    fixture.componentRef.setInput('message', 'Loading your medical dashboard...');
    fixture.detectChanges();
    const msg = fixture.nativeElement.querySelector('.logo-loader-message');
    expect(msg).toBeTruthy();
    expect(msg.textContent.trim()).toBe('Loading your medical dashboard...');
  });

  it('should apply fullscreen class when fullScreen input is true', () => {
    fixture.componentRef.setInput('fullScreen', true);
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('.logo-loader-container');
    expect(container.classList.contains('fullscreen')).toBe(true);
  });
});
