import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { UniversityAuthService } from '../../../auth/services/university-auth.service';
import { UniversityNotificationsService } from '../../../notifications/services/university-notifications.service';
import { UniversityHeaderComponent } from './university-header';

describe('UniversityHeaderComponent', () => {
  let component: UniversityHeaderComponent;
  let fixture: ComponentFixture<UniversityHeaderComponent>;
  let authServiceMock: {
    currentUser: ReturnType<typeof signal<any>>;
    logoutLoading: ReturnType<typeof signal<boolean>>;
    logout: ReturnType<typeof vi.fn>;
  };
  let notificationsServiceMock: {
    unreadCount: ReturnType<typeof signal<number>>;
    getUnreadCount: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  const mockUser = {
    organizationId: 'ORG_TSMU_001',
    name: 'Tbilisi State Medical University',
    code: 'TSMU',
    email: 'admin@tsmu.edu',
  };

  beforeEach(async () => {
    authServiceMock = {
      currentUser: signal<any>(mockUser),
      logoutLoading: signal<boolean>(false),
      logout: vi.fn().mockReturnValue(of({ success: true })),
    };

    notificationsServiceMock = {
      unreadCount: signal<number>(3),
      getUnreadCount: vi.fn().mockReturnValue(of({ success: true, data: { unreadCount: 3 } })),
    };

    await TestBed.configureTestingModule({
      imports: [UniversityHeaderComponent],
      providers: [
        provideRouter([]),
        { provide: UniversityAuthService, useValue: authServiceMock },
        { provide: UniversityNotificationsService, useValue: notificationsServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));

    fixture = TestBed.createComponent(UniversityHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create UniversityHeaderComponent', () => {
    expect(component).toBeTruthy();
    expect(component.unreadCount()).toBe(3);
  });

  it('should display brand logo, name, and UNIVERSITY PORTAL badge', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand-logo-img')).toBeTruthy();
    expect(compiled.querySelector('.portal-badge')?.textContent).toContain('UNIVERSITY PORTAL');
  });

  it('should render navigation links for Dashboard, Candidates, Invitations, Templates, Notifications', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('.portal-nav .nav-link');
    expect(links.length).toBe(5);

    const texts = Array.from(links).map((l) => l.textContent?.trim());
    expect(texts[0]).toContain('Dashboard');
    expect(texts[1]).toContain('Candidates');
    expect(texts[2]).toContain('Invitations');
    expect(texts[3]).toContain('Templates');
    expect(texts[4]).toContain('Notifications');
  });

  it('should render unread badge if notifications count > 0', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('.nav-unread-badge');
    expect(badge).toBeTruthy();
    expect(badge?.textContent?.trim()).toBe('3');
  });

  it('should display user organization name and avatar initial', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.user-avatar-initial')?.textContent?.trim()).toBe('T');
    expect(compiled.querySelector('.user-name-text')?.textContent?.trim()).toBe('Tbilisi State Medical University');
  });

  it('should call logout and navigate to login on Sign Out click', () => {
    component.logout();
    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/university/auth/login']);
  });
});
