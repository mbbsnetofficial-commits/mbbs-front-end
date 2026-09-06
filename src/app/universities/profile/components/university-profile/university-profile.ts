import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Icon } from '../../../../shared/ui/icon/icon';
import { UniversityAuthService } from '../../../auth/services/university-auth.service';
import { UniversityHeaderComponent } from '../../../shared/components/university-header/university-header';
import {
  UniversityProfile,
  UpdateUniversityProfileRequest,
} from '../../models/university-profile.model';
import { UniversityProfileService } from '../../services/university-profile.service';

@Component({
  selector: 'app-university-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, Icon, UniversityHeaderComponent],
  templateUrl: './university-profile.html',
  styleUrl: './university-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UniversityProfileComponent implements OnInit {
  private readonly profileService = inject(UniversityProfileService);
  private readonly authService = inject(UniversityAuthService, { optional: true });
  private readonly router = inject(Router, { optional: true });

  readonly profile = this.profileService.profile;
  readonly loading = this.profileService.loading;
  readonly updating = this.profileService.updating;
  readonly error = this.profileService.error;

  readonly logoutLoading = computed(() => {
    if (typeof this.authService?.logoutLoading === 'function') {
      return this.authService.logoutLoading();
    }
    return false;
  });

  readonly isEditMode = signal<boolean>(false);
  readonly formValidationErrorMessage = signal<string | null>(null);
  readonly toastSuccessMessage = signal<string | null>(null);

  // Form Model State
  formName = '';
  formCountry = '';
  formCity = '';
  formDescription = '';
  formWebsite = '';
  formContactEmail = '';
  formContactPhone = '';
  formLogo = '';
  formCoverImage = '';
  formTuitionMin: number | null = null;
  formTuitionMax: number | null = null;
  formScholarshipAmount: number | null = null;
  formOtherFees: number | null = null;
  readonly formAccreditations = signal<string[]>([]);
  newAccreditationInput = '';

  // Password Change Form State
  formCurrentPassword = '';
  formNewPassword = '';
  formConfirmPassword = '';
  readonly showCurrentPassword = signal<boolean>(false);
  readonly showNewPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);
  readonly changingPassword = signal<boolean>(false);
  readonly passwordSuccessMessage = signal<string | null>(null);
  readonly passwordErrorMessage = signal<string | null>(null);

  toggleShowCurrentPassword(): void {
    this.showCurrentPassword.update((val) => !val);
  }

  toggleShowNewPassword(): void {
    this.showNewPassword.update((val) => !val);
  }

  toggleShowConfirmPassword(): void {
    this.showConfirmPassword.update((val) => !val);
  }

  validatePasswordFields(): string | null {
    if (!this.formCurrentPassword && !this.formNewPassword && !this.formConfirmPassword) {
      return null; // No password change attempted
    }

    if (!this.formCurrentPassword) {
      return 'Please enter your current password.';
    }

    if (!this.formNewPassword) {
      return 'Please enter a new password.';
    }

    if (this.formNewPassword.length < 8) {
      return 'New password must be at least 8 characters long.';
    }

    if (this.formNewPassword !== this.formConfirmPassword) {
      return 'New password and confirmation do not match.';
    }

    if (this.formCurrentPassword === this.formNewPassword) {
      return 'New password must be different from current password.';
    }

    return null;
  }

  updatePasswordOnly(): void {
    this.passwordErrorMessage.set(null);
    this.passwordSuccessMessage.set(null);

    const validationErr = this.validatePasswordFields();
    if (validationErr) {
      this.passwordErrorMessage.set(validationErr);
      return;
    }

    if (!this.formCurrentPassword || !this.formNewPassword) {
      this.passwordErrorMessage.set('Please enter your current and new password.');
      return;
    }

    this.changingPassword.set(true);
    this.profileService
      .changePassword(this.formCurrentPassword, this.formNewPassword)
      .subscribe({
        next: (res) => {
          this.changingPassword.set(false);
          this.formCurrentPassword = '';
          this.formNewPassword = '';
          this.formConfirmPassword = '';
          this.passwordSuccessMessage.set('Password updated successfully.');
          this.showToast('Portal password updated successfully.');
          setTimeout(() => {
            this.passwordSuccessMessage.set(null);
          }, 5000);
        },
        error: (err) => {
          this.changingPassword.set(false);
          const rawCode = err?.error?.error?.code || err?.error?.code;
          let msg =
            err?.error?.message ||
            err?.error?.error?.message ||
            err?.error?.error ||
            err?.message;

          if (rawCode === 'INVALID_CURRENT_PASSWORD' || msg?.toLowerCase().includes('current password is incorrect')) {
            msg = 'The current password you entered is incorrect. Please check and try again.';
          } else if (rawCode === 'CREDENTIAL_NOT_FOUND' || msg?.toLowerCase().includes('credential record not found')) {
            msg = 'Institutional account credential record could not be found. Please contact portal administration.';
          } else if (rawCode === 'SAME_PASSWORD' || msg?.toLowerCase().includes('different from')) {
            msg = 'New password must be different from your current password.';
          } else if (rawCode === 'WEAK_PASSWORD' || msg?.toLowerCase().includes('password must')) {
            msg = 'New password must be at least 8 characters with uppercase, lowercase, number, and special character.';
          } else if (!msg || typeof msg !== 'string') {
            msg = 'Failed to change password. Please check your credentials and try again.';
          }

          this.passwordErrorMessage.set(msg);
        },
      });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.profileService.getProfile().subscribe({
      error: () => {
        // Handled by service error signal
      },
    });
  }

  retry(): void {
    this.loadProfile();
  }

  resolvedLogo(): string {
    const prof = this.profile();
    if (!prof) return '';
    if (prof.logo && !prof.logo.includes('tsmu-campus') && !prof.logo.includes('campus') && !prof.logo.includes('unsplash')) {
      return prof.logo;
    }
    const name = (prof.name || '').toLowerCase();
    if (name.includes('tbilisi') || name.includes('tsmu')) {
      return '/images/universities/tsmu-logo.png';
    }
    if (name.includes('msu') || name.includes('management')) {
      return '/images/universities/msu-logo.png';
    }
    return prof.logo || '';
  }

  resolvedCoverImage(): string {
    const prof = this.profile();
    if (!prof) return '';
    if (prof.coverImage) return prof.coverImage;
    if (prof.banner) return prof.banner;
    // If prof.logo happened to be the campus building photo, use it as cover image:
    if (prof.logo && (prof.logo.includes('campus') || prof.logo.includes('tsmu-campus'))) {
      return prof.logo;
    }
    const name = (prof.name || '').toLowerCase();
    if (name.includes('tbilisi') || name.includes('tsmu')) {
      return '/images/universities/tsmu-campus.png';
    }
    return '';
  }

  enterEditMode(focusTarget?: 'logo' | 'cover'): void {
    const prof = this.profile();
    if (!prof) return;

    this.formName = prof.name || '';
    this.formCountry = prof.country || '';
    this.formCity = prof.city || '';
    this.formDescription = prof.description || '';
    this.formWebsite = prof.website || '';
    this.formContactEmail = prof.contactEmail || '';
    this.formContactPhone = prof.contactPhone || '';
    this.formLogo = this.resolvedLogo();
    this.formCoverImage = this.resolvedCoverImage();
    this.formTuitionMin =
      prof.tuitionFeeMinUsd !== undefined ? prof.tuitionFeeMinUsd : null;
    this.formTuitionMax =
      prof.tuitionFeeMaxUsd !== undefined ? prof.tuitionFeeMaxUsd : null;
    this.formScholarshipAmount =
      prof.scholarshipAmount !== undefined ? prof.scholarshipAmount : null;
    this.formOtherFees =
      prof.otherFees !== undefined ? prof.otherFees : null;
    this.formAccreditations.set(
      Array.isArray(prof.accreditations) ? [...prof.accreditations] : []
    );
    this.newAccreditationInput = '';
    this.formValidationErrorMessage.set(null);
    this.isEditMode.set(true);

    if (focusTarget) {
      setTimeout(() => {
        const el = document.getElementById(`uploader-${focusTarget}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
    }
  }

  cancelEditMode(): void {
    if (this.updating() || this.changingPassword()) return;
    this.formCurrentPassword = '';
    this.formNewPassword = '';
    this.formConfirmPassword = '';
    this.passwordErrorMessage.set(null);
    this.passwordSuccessMessage.set(null);
    this.isEditMode.set(false);
    this.formValidationErrorMessage.set(null);
  }

  onLogoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.formValidationErrorMessage.set('Please choose a valid image file (PNG, JPG, WebP, SVG).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.formValidationErrorMessage.set('Logo file size must be less than 5MB.');
      return;
    }
    this.formValidationErrorMessage.set(null);
    const reader = new FileReader();
    reader.onload = () => {
      this.formLogo = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onCoverFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.formValidationErrorMessage.set('Please choose a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.formValidationErrorMessage.set('Campus cover file size must be less than 5MB.');
      return;
    }
    this.formValidationErrorMessage.set(null);
    const reader = new FileReader();
    reader.onload = () => {
      this.formCoverImage = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.formLogo = '';
  }

  removeCoverImage(): void {
    this.formCoverImage = '';
  }

  addAccreditation(): void {
    const tag = this.newAccreditationInput.trim();
    if (!tag) return;

    const current = this.formAccreditations();
    if (!current.some((item) => item.toUpperCase() === tag.toUpperCase())) {
      this.formAccreditations.set([...current, tag]);
    }
    this.newAccreditationInput = '';
  }

  removeAccreditation(index: number): void {
    const current = this.formAccreditations();
    this.formAccreditations.set(current.filter((_, i) => i !== index));
  }

  submitForm(): void {
    if (this.updating()) return;

    const trimmedName = this.formName.trim();
    const trimmedCountry = this.formCountry.trim();
    const trimmedCity = this.formCity.trim();
    const trimmedDescription = this.formDescription.trim();
    const trimmedEmail = this.formContactEmail.trim();
    const trimmedWebsite = this.formWebsite.trim();
    const trimmedPhone = this.formContactPhone.trim();

    if (!trimmedName) {
      this.formValidationErrorMessage.set('University Name is required.');
      return;
    }

    if (!trimmedCountry) {
      this.formValidationErrorMessage.set('Country is required.');
      return;
    }

    if (!trimmedCity) {
      this.formValidationErrorMessage.set('City is required.');
      return;
    }

    if (!trimmedDescription) {
      this.formValidationErrorMessage.set('Description is required.');
      return;
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      this.formValidationErrorMessage.set(
        'A valid Admissions / Contact Email is required.'
      );
      return;
    }

    if (
      this.formTuitionMin !== null &&
      this.formTuitionMax !== null &&
      this.formTuitionMin > this.formTuitionMax
    ) {
      this.formValidationErrorMessage.set(
        'Minimum Tuition Fee cannot be greater than Maximum Tuition Fee.'
      );
      return;
    }

    if (
      (this.formTuitionMin !== null && this.formTuitionMin < 0) ||
      (this.formTuitionMax !== null && this.formTuitionMax < 0)
    ) {
      this.formValidationErrorMessage.set('Tuition fees must be non-negative.');
      return;
    }

    const pwdErr = this.validatePasswordFields();
    if (pwdErr) {
      this.formValidationErrorMessage.set(pwdErr);
      return;
    }

    this.formValidationErrorMessage.set(null);

    const payload: UpdateUniversityProfileRequest = {
      name: trimmedName,
      country: trimmedCountry,
      city: trimmedCity,
      description: trimmedDescription,
      contactEmail: trimmedEmail,
      website: trimmedWebsite || null,
      contactPhone: trimmedPhone || null,
      logo: this.formLogo.trim() || null,
      coverImage: this.formCoverImage.trim() || null,
      banner: this.formCoverImage.trim() || null,
      tuitionFeeMinUsd:
        this.formTuitionMin !== null && !isNaN(Number(this.formTuitionMin))
          ? Number(this.formTuitionMin)
          : null,
      tuitionFeeMaxUsd:
        this.formTuitionMax !== null && !isNaN(Number(this.formTuitionMax))
          ? Number(this.formTuitionMax)
          : null,
      scholarshipAmount:
        this.formScholarshipAmount !== null && !isNaN(Number(this.formScholarshipAmount))
          ? Number(this.formScholarshipAmount)
          : null,
      otherFees:
        this.formOtherFees !== null && !isNaN(Number(this.formOtherFees))
          ? Number(this.formOtherFees)
          : null,
      accreditations: this.formAccreditations(),
      ...(this.formNewPassword.trim()
        ? {
            currentPassword: this.formCurrentPassword,
            newPassword: this.formNewPassword,
          }
        : {}),
    };

    this.profileService.updateProfile(payload).subscribe({
      next: (res) => {
        if (res?.success) {
          const changedPwd = !!this.formNewPassword.trim();
          this.formCurrentPassword = '';
          this.formNewPassword = '';
          this.formConfirmPassword = '';
          this.passwordErrorMessage.set(null);
          this.passwordSuccessMessage.set(null);
          this.isEditMode.set(false);
          this.showToast(
            changedPwd
              ? 'Organization profile and password updated successfully.'
              : 'Organization profile updated successfully.'
          );
        }
      },
      error: (err) => {
        const rawCode = err?.error?.error?.code || err?.error?.code;
        let msg =
          err?.error?.message ||
          err?.error?.error?.message ||
          err?.error?.error ||
          err?.message;

        if (rawCode === 'INVALID_CURRENT_PASSWORD' || msg?.toLowerCase().includes('current password is incorrect')) {
          msg = 'The current password you entered is incorrect. Please check and try again.';
        } else if (rawCode === 'CREDENTIAL_NOT_FOUND' || msg?.toLowerCase().includes('credential record not found')) {
          msg = 'Institutional account credential record could not be found. Please contact portal administration.';
        } else if (rawCode === 'SAME_PASSWORD' || msg?.toLowerCase().includes('different from')) {
          msg = 'New password must be different from your current password.';
        } else if (rawCode === 'WEAK_PASSWORD' || msg?.toLowerCase().includes('password must')) {
          msg = 'New password must be at least 8 characters with uppercase, lowercase, number, and special character.';
        } else if (!msg || typeof msg !== 'string') {
          msg = 'Failed to update organization profile. Please try again.';
        }

        this.formValidationErrorMessage.set(msg);
      },
    });
  }

  logout(): void {
    if (this.authService) {
      this.authService.logout().subscribe({
        next: () => {
          this.router?.navigate(['/university/auth/login']);
        },
        error: () => {
          this.router?.navigate(['/university/auth/login']);
        },
      });
    } else {
      this.router?.navigate(['/university/auth/login']);
    }
  }

  private showToast(msg: string): void {
    this.toastSuccessMessage.set(msg);
    setTimeout(() => {
      this.toastSuccessMessage.set(null);
    }, 4000);
  }
}
