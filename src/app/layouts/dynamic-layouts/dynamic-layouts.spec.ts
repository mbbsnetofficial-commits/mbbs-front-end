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
});
