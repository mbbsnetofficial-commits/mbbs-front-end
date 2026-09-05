import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../../../shared/ui/icon/icon';
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

  readonly profile = this.profileService.profile;
  readonly loading = this.profileService.loading;
  readonly updating = this.profileService.updating;
  readonly error = this.profileService.error;

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
  readonly formAccreditations = signal<string[]>([]);
  newAccreditationInput = '';

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
    if (this.updating()) return;
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
      accreditations: this.formAccreditations(),
    };

    this.profileService.updateProfile(payload).subscribe({
      next: (res) => {
        if (res?.success) {
          this.isEditMode.set(false);
          this.showToast('Organization profile updated successfully.');
        }
      },
      error: (err) => {
        const msg =
          err?.error?.message ||
          err?.error?.error ||
          err?.message ||
          'Failed to update organization profile. Please try again.';
        this.formValidationErrorMessage.set(msg);
      },
    });
  }

  private showToast(msg: string): void {
    this.toastSuccessMessage.set(msg);
    setTimeout(() => {
      this.toastSuccessMessage.set(null);
    }, 4000);
  }
}
