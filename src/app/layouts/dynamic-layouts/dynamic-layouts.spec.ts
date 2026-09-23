import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { DynamicLayouts } from './dynamic-layouts';

describe('DynamicLayouts', () => {
  let component: DynamicLayouts;
  let fixture: ComponentFixture<DynamicLayouts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicLayouts],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicLayouts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }, 30000);

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle notifications open state and close other overlays', () => {
    expect((component as any).notificationOpen()).toBe(false);
    (component as any).toggleNotifications();
    expect((component as any).notificationOpen()).toBe(true);
    expect((component as any).commandOpen()).toBe(false);
    expect((component as any).profileOpen()).toBe(false);

    (component as any).toggleNotifications();
    expect((component as any).notificationOpen()).toBe(false);
  });

  it('should map notification types to appropriate icon names', () => {
    expect((component as any).notificationIcon('test')).toBe('sparkles');
    expect((component as any).notificationIcon('reminder')).toBe('clock');
    expect((component as any).notificationIcon('chatbot')).toBe('chat');
    expect((component as any).notificationIcon('account')).toBe('profile');
    expect((component as any).notificationIcon('system')).toBe('bell');
    expect((component as any).notificationIcon(undefined)).toBe('bell');
  });

  it('should include delete account link in profile popover and destinations', () => {
    (component as any).toggleProfile();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const deleteLink = compiled.querySelector('a[href="/delete-account"]');
    expect(deleteLink).toBeTruthy();

    const dest = (component as any).destinations.find((d: any) => d.route === '/delete-account');
    expect(dest).toBeTruthy();
  });
});
