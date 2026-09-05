import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UniversityProfile } from '../../models/university-profile.model';
import { UniversityProfileService } from '../../services/university-profile.service';
import { UniversityProfileComponent } from './university-profile';

describe('UniversityProfileComponent', () => {
  let component: UniversityProfileComponent;
  let fixture: ComponentFixture<UniversityProfileComponent>;
  let profileServiceMock: {
    profile: ReturnType<typeof signal<UniversityProfile | null>>;
    loading: ReturnType<typeof signal<boolean>>;
    updating: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    getProfile: ReturnType<typeof vi.fn>;
    updateProfile: ReturnType<typeof vi.fn>;
  };

  const mockProfile: UniversityProfile = {
    organizationId: 'ORG_TSMU_001',
    name: 'Tbilisi State Medical University',
    code: 'TSMU',
    country: 'Georgia',
    city: 'Tbilisi',
    logo: 'https://example.com/tsmu-logo.png',
    description:
      'Leading state medical university in Georgia offering WHO-recognized English MD programs.',
    website: 'https://tsmu.edu',
    contactEmail: 'admissions@tsmu.edu',
    contactPhone: '+995322542488',
    address: '33 Vazha-Pshavela Ave, Tbilisi 0186, Georgia',
    accreditations: ['WHO', 'WFME', 'NMC', 'FAIMER', 'ECFMG'],
    worldRanking: 450,
    tuitionFeeMinUsd: 6000,
    tuitionFeeMaxUsd: 8000,
  };

  beforeEach(async () => {
    profileServiceMock = {
      profile: signal<UniversityProfile | null>(mockProfile),
      loading: signal<boolean>(false),
      updating: signal<boolean>(false),
      error: signal<string | null>(null),
      getProfile: vi.fn().mockReturnValue(
        of({
          success: true,
          data: mockProfile,
        })
      ),
      updateProfile: vi.fn().mockReturnValue(
        of({
          success: true,
          message: 'Organization profile updated successfully',
          data: {
            ...mockProfile,
            name: 'Tbilisi State Medical University (Updated)',
          },
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [UniversityProfileComponent],
      providers: [
        provideRouter([]),
        { provide: UniversityProfileService, useValue: profileServiceMock },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));

    fixture = TestBed.createComponent(UniversityProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }, 30000);

  it('should create UniversityProfileComponent and load profile on init', () => {
    expect(component).toBeTruthy();
    expect(profileServiceMock.getProfile).toHaveBeenCalled();
  });

  describe('View Mode (API #17)', () => {
    it('1. should render real university identity, location, and description', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain(
        'Tbilisi State Medical University'
      );
      expect(compiled.textContent).toContain('TSMU');
      expect(compiled.textContent).toContain('ID: ORG_TSMU_001');
      expect(compiled.textContent).toContain('Tbilisi, Georgia');
      expect(compiled.textContent).toContain(
        'Leading state medical university in Georgia'
      );
    });

    it('2. should render contact information, tuition fees, and accreditations chips', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('admissions@tsmu.edu');
      expect(compiled.textContent).toContain('+995322542488');
      expect(compiled.textContent).toContain('$6,000 - $8,000');
      expect(compiled.textContent).toContain('WHO');
      expect(compiled.textContent).toContain('WFME');
    });

    it('3. should render external website link with safe target and rel attributes', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const websiteLink = compiled.querySelector(
        'a.website-link'
      ) as HTMLAnchorElement;
      expect(websiteLink).toBeTruthy();
      expect(websiteLink.href).toBe('https://tsmu.edu/');
      expect(websiteLink.target).toBe('_blank');
      expect(websiteLink.rel).toContain('noopener');
    });

    it('4. should render Sign Out button in identity actions and trigger logout', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const signOutBtn = compiled.querySelector(
        '.identity-actions button.btn-logout'
      ) as HTMLButtonElement;
      expect(signOutBtn).toBeTruthy();
      expect(signOutBtn.textContent).toContain('Sign Out');

      const logoutSpy = vi.spyOn(component, 'logout');
      signOutBtn.click();
      expect(logoutSpy).toHaveBeenCalled();
    });
  });

  describe('Edit Mode & Validation (API #18)', () => {
    it('1. should switch to edit mode and pre-populate form fields when clicking Edit Profile', () => {
      component.enterEditMode();
      fixture.detectChanges();

      expect(component.isEditMode()).toBe(true);
      expect(component.formName).toBe('Tbilisi State Medical University');
      expect(component.formCountry).toBe('Georgia');
      expect(component.formCity).toBe('Tbilisi');
      expect(component.formContactEmail).toBe('admissions@tsmu.edu');
      expect(component.formTuitionMin).toBe(6000);
      expect(component.formTuitionMax).toBe(8000);
      expect(component.formAccreditations()).toEqual([
        'WHO',
        'WFME',
        'NMC',
        'FAIMER',
        'ECFMG',
      ]);
    });

    it('2. should cancel edit mode and revert changes when clicking Cancel', () => {
      component.enterEditMode();
      component.cancelEditMode();
      fixture.detectChanges();

      expect(component.isEditMode()).toBe(false);
    });

    it('3. should allow adding and removing accreditation tags', () => {
      component.enterEditMode();
      component.newAccreditationInput = 'NEW_ACCREDITATION';
      component.addAccreditation();

      expect(component.formAccreditations()).toContain('NEW_ACCREDITATION');

      // Duplicate prevention
      component.newAccreditationInput = 'new_accreditation';
      component.addAccreditation();
      expect(
        component
          .formAccreditations()
          .filter((a) => a.toUpperCase() === 'NEW_ACCREDITATION').length
      ).toBe(1);

      // Remove tag
      component.removeAccreditation(0);
      expect(component.formAccreditations()).not.toContain('WHO');
    });

    it('4. should validate empty required fields and prevent submission', () => {
      component.enterEditMode();
      component.formName = '   ';
      component.submitForm();

      expect(profileServiceMock.updateProfile).not.toHaveBeenCalled();
      expect(component.formValidationErrorMessage()).toBe(
        'University Name is required.'
      );
    });

    it('5. should validate tuition fee min <= max and prevent submission if min > max', () => {
      component.enterEditMode();
      component.formTuitionMin = 9000;
      component.formTuitionMax = 5000;
      component.submitForm();

      expect(profileServiceMock.updateProfile).not.toHaveBeenCalled();
      expect(component.formValidationErrorMessage()).toContain(
        'Minimum Tuition Fee cannot be greater than Maximum Tuition Fee'
      );
    });

    it('6. should validate invalid email format and prevent submission', () => {
      component.enterEditMode();
      component.formContactEmail = 'invalid-email';
      component.submitForm();

      expect(profileServiceMock.updateProfile).not.toHaveBeenCalled();
      expect(component.formValidationErrorMessage()).toContain(
        'A valid Admissions / Contact Email is required.'
      );
    });

    it('7. should call updateProfile with trimmed payload and exit edit mode upon success', () => {
      component.enterEditMode();
      component.formName = 'Tbilisi State Medical University (Updated)';
      component.submitForm();

      expect(profileServiceMock.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Tbilisi State Medical University (Updated)',
          country: 'Georgia',
          city: 'Tbilisi',
          description:
            'Leading state medical university in Georgia offering WHO-recognized English MD programs.',
          website: 'https://tsmu.edu',
          contactEmail: 'admissions@tsmu.edu',
          contactPhone: '+995322542488',
          tuitionFeeMinUsd: 6000,
          tuitionFeeMaxUsd: 8000,
          accreditations: ['WHO', 'WFME', 'NMC', 'FAIMER', 'ECFMG'],
          logo: 'https://example.com/tsmu-logo.png',
          coverImage: '/images/universities/tsmu-campus.png',
          banner: '/images/universities/tsmu-campus.png',
        })
      );

      expect(component.isEditMode()).toBe(false);
      expect(component.toastSuccessMessage()).toContain('updated successfully');
    });

    it('8. should remain in edit mode and show error if updateProfile fails', () => {
      profileServiceMock.updateProfile.mockReturnValue(
        throwError(() => ({
          error: { message: 'Failed to update organization profile.' },
          status: 500,
        }))
      );

      component.enterEditMode();
      component.submitForm();

      expect(profileServiceMock.updateProfile).toHaveBeenCalled();
      expect(component.isEditMode()).toBe(true);
      expect(component.formValidationErrorMessage()).toBe(
        'Failed to update organization profile.'
      );
    });
  });

  describe('UI States & Retry', () => {
    it('should render error alert and retry on button click', () => {
      profileServiceMock.profile.set(null);
      profileServiceMock.error.set('Failed to load profile.');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const errorAlert = compiled.querySelector('.alert-card.error');
      expect(errorAlert).toBeTruthy();
      expect(errorAlert?.textContent).toContain(
        'Failed to Load Organization Profile'
      );

      const retryBtn = compiled.querySelector('.btn-retry') as HTMLButtonElement;
      expect(retryBtn).toBeTruthy();

      retryBtn.click();
      expect(profileServiceMock.getProfile).toHaveBeenCalledTimes(2);
    });
  });
});
