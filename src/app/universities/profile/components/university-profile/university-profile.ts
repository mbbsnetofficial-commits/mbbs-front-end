import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../../shared/ui/icon/icon';
import {
  UniversityProfile,
  UpdateUniversityProfileRequest,
} from '../../models/university-profile.model';
import { UniversityProfileService } from '../../services/university-profile.service';

@Component({
  selector: 'app-university-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, Icon],
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

  enterEditMode(): void {
    const prof = this.profile();
    if (!prof) return;

    this.formName = prof.name || '';
    this.formCountry = prof.country || '';
    this.formCity = prof.city || '';
    this.formDescription = prof.description || '';
    this.formWebsite = prof.website || '';
    this.formContactEmail = prof.contactEmail || '';
    this.formContactPhone = prof.contactPhone || '';
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
  }

  cancelEditMode(): void {
    if (this.updating()) return;
    this.isEditMode.set(false);
    this.formValidationErrorMessage.set(null);
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
