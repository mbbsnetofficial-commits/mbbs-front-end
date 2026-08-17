import { TestBed } from '@angular/core/testing';

import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TokenService]
    });
    service = TestBed.inject(TokenService);
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save and retrieve tokens in localStorage', () => {
    service.saveTokens('test_access', 'test_refresh', 'test_student', true);

    expect(service.getAccessToken()).toBe('test_access');
    expect(service.getRefreshToken()).toBe('test_refresh');
    expect(service.getStudentId()).toBe('test_student');
    expect(service.isLoggedIn()).toBe(true);
  });

  it('should update tokens', () => {
    service.saveTokens('test_access', 'test_refresh', 'test_student', true);
    service.updateTokens('new_access', 'new_refresh');

    expect(service.getAccessToken()).toBe('new_access');
    expect(service.getRefreshToken()).toBe('new_refresh');
  });

  it('should clear tokens on logout', () => {
    service.saveTokens('test_access', 'test_refresh', 'test_student', true);
    service.clearTokens();

    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should save and retrieve currentUser', () => {
    const user = {
      id: 'u1',
      student_id: 's1',
      fullName: 'Sanjay Kumar',
      phoneNumber: '+919444308959',
      email: 'sanjay@example.com'
    };
    service.saveUser(user, true);

    expect(service.getCurrentUser()?.fullName).toBe('Sanjay Kumar');
    expect(service.getUserDisplayName()).toBe('Sanjay');
  });
});
