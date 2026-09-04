import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { StudentProfileService } from '../../../services/student-profile.service';
import { ProfileHeaderComponent } from '../profile-header/profile-header';
import { Icon } from '../../../../../../shared/ui/icon/icon';
import {
  AcademicInformation,
  DocumentType,
  EntranceExam,
  MbbsPreferences,
  PersonalInformation,
  StudentDocument,
  StudentProfile,
} from '../../../models/student-profile.model';

const POPULAR_COUNTRIES = [
  'Russia',
  'Uzbekistan',
  'Georgia',
  'Kazakhstan',
  'Kyrgyzstan',
  'Philippines',
  'Egypt',
  'Nepal',
  'Bangladesh',
];

const INTAKE_OPTIONS = [
  'September / October 2026',
  'January / February 2027',
  'Fall 2026 (Direct)',
  'Spring 2027',
];

const EDUCATION_BOARDS = [
  'CBSE (Central Board of Secondary Education)',
  'CISCE / ISC (Indian School Certificate)',
  'State Board (Maharashtra / Karnataka / Tamil Nadu / UP / etc.)',
  'National Open School (NIOS)',
  'International Baccalaureate (IB)',
  'Cambridge International (A-Levels)',
];

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProfileHeaderComponent,
    Icon,
    CurrencyPipe,
  ],
  templateUrl: './student-profile.component.html',
  styleUrl: './student-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentProfileComponent {
  private readonly profileService = inject(StudentProfileService);

  readonly profile = this.profileService.profile;
  readonly activeSection = signal<string>('personal');
  readonly showSuccessToast = signal<string | null>(null);

  // Loading & Saving states
  readonly isSavingPersonal = signal<boolean>(false);
  readonly isSavingAcademic = signal<boolean>(false);
  readonly isSavingEntrance = signal<boolean>(false);
  readonly isSavingPreferences = signal<boolean>(false);
  readonly isUploadingDocument = signal<string | null>(null);
  readonly isDeletingDocument = signal<string | null>(null);
  readonly isUploadingPhoto = signal<boolean>(false);

  // Edit states for sections
  readonly editingPersonal = signal<boolean>(false);
  readonly editingAcademic = signal<boolean>(false);
  readonly editingEntrance = signal<boolean>(false);
  readonly editingPreferences = signal<boolean>(false);

  // Form draft models
  personalDraft: PersonalInformation = { ...this.profile().personal };
  academicDraft: AcademicInformation = { ...this.profile().academic };
  entranceDraft: EntranceExam[] = JSON.parse(JSON.stringify(this.profile().entranceExams || []));
  preferencesDraft: MbbsPreferences = { ...this.profile().preferences };

  readonly popularCountries = POPULAR_COUNTRIES;
  readonly intakeOptions = INTAKE_OPTIONS;
  readonly educationBoards = EDUCATION_BOARDS;

  readonly strokeDashoffset = computed(() => {
    const pct = this.profile().completionPercentage;
    const circumference = 2 * Math.PI * 38;
    return circumference - (pct / 100) * circumference;
  });

  onSectionSelected(sectionKey: string): void {
    this.activeSection.set(sectionKey);
    const element = document.getElementById(`${sectionKey}-section`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  formatDate(val?: string | null): string {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return val;
    }
  }

  formatGender(val?: string | null): string {
    if (!val) return '—';
    const v = val.toLowerCase();
    return v.charAt(0).toUpperCase() + v.slice(1);
  }

  // Personal
  startEditPersonal(): void {
    this.personalDraft = { ...this.profile().personal };
    this.editingPersonal.set(true);
  }
  cancelEditPersonal(): void {
    this.editingPersonal.set(false);
  }
  savePersonal(): void {
    if (this.isSavingPersonal()) return;
    this.isSavingPersonal.set(true);

    this.profileService.updatePersonal(this.personalDraft).subscribe({
      next: (updated) => {
        this.personalDraft = { ...updated.personal };
        this.editingPersonal.set(false);
        this.isSavingPersonal.set(false);
        this.triggerToast('Personal details updated successfully.');
      },
      error: (err) => {
        this.isSavingPersonal.set(false);
        const msg = err?.error?.message || 'Failed to update personal details. Please try again.';
        this.triggerToast(msg);
      },
    });
  }

  // Academic
  startEditAcademic(): void {
    this.academicDraft = { ...this.profile().academic };
    this.editingAcademic.set(true);
  }
  cancelEditAcademic(): void {
    this.editingAcademic.set(false);
  }
  saveAcademic(): void {
    if (this.isSavingAcademic()) return;
    this.isSavingAcademic.set(true);

    this.profileService.updateAcademic(this.academicDraft).subscribe({
      next: (updated) => {
        this.academicDraft = { ...updated.academic };
        this.editingAcademic.set(false);
        this.isSavingAcademic.set(false);
        this.triggerToast('Academic records updated successfully.');
      },
      error: (err) => {
        this.isSavingAcademic.set(false);
        const msg = err?.error?.message || 'Failed to update academic records. Please try again.';
        this.triggerToast(msg);
      },
    });
  }

  // Entrance
  startEditEntrance(): void {
    this.entranceDraft = JSON.parse(JSON.stringify(this.profile().entranceExams || []));
    if (this.entranceDraft.length === 0) {
      this.entranceDraft.push({
        id: 'exam-neet',
        examType: 'NEET',
        year: undefined,
        score: undefined,
        maxScore: 720,
        rollNumber: '',
        qualified: false,
      });
    }
    this.editingEntrance.set(true);
  }
  cancelEditEntrance(): void {
    this.editingEntrance.set(false);
  }
  saveEntrance(): void {
    if (this.isSavingEntrance()) return;
    this.isSavingEntrance.set(true);

    this.profileService.updateEntrance(this.entranceDraft).subscribe({
      next: (updated) => {
        this.entranceDraft = JSON.parse(JSON.stringify(updated.entranceExams || []));
        this.editingEntrance.set(false);
        this.isSavingEntrance.set(false);
        this.triggerToast('NEET & Entrance examination scores updated.');
      },
      error: (err) => {
        this.isSavingEntrance.set(false);
        const msg = err?.error?.message || 'Failed to update entrance examination scores. Please try again.';
        this.triggerToast(msg);
      },
    });
  }

  // Preferences
  startEditPreferences(): void {
    this.preferencesDraft = {
      ...this.profile().preferences,
      preferredCountries: [...(this.profile().preferences.preferredCountries || [])],
      preferredIntake: [...(this.profile().preferences.preferredIntake || [])],
    };
    this.editingPreferences.set(true);
  }
  cancelEditPreferences(): void {
    this.editingPreferences.set(false);
  }
  savePreferences(): void {
    if (this.isSavingPreferences()) return;
    this.isSavingPreferences.set(true);

    this.profileService.updatePreferences(this.preferencesDraft).subscribe({
      next: (updated) => {
        this.preferencesDraft = {
          ...updated.preferences,
          preferredCountries: [...(updated.preferences.preferredCountries || [])],
          preferredIntake: [...(updated.preferences.preferredIntake || [])],
        };
        this.editingPreferences.set(false);
        this.isSavingPreferences.set(false);
        this.triggerToast('MBBS matching preferences updated.');
      },
      error: (err) => {
        this.isSavingPreferences.set(false);
        const msg = err?.error?.message || 'Failed to update MBBS preferences. Please try again.';
        this.triggerToast(msg);
      },
    });
  }
  toggleCountryPreference(country: string): void {
    const list = this.preferencesDraft.preferredCountries || [];
    const idx = list.indexOf(country);
    if (idx >= 0) {
      this.preferencesDraft.preferredCountries = list.filter((c) => c !== country);
    } else {
      this.preferencesDraft.preferredCountries = [...list, country];
    }
  }

  // Documents
  onFileUpload(event: Event, type: DocumentType): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // File size validation (10 MB max)
      if (file.size > 10 * 1024 * 1024) {
        this.triggerToast('File is too large. Maximum allowed size is 10 MB.');
        input.value = '';
        return;
      }

      // File type validation
      const allowed = ['pdf', 'png', 'jpeg', 'jpg', 'webp'];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!allowed.includes(ext)) {
        this.triggerToast('Unsupported file type. Please upload a PDF, PNG, JPG, or WEBP file.');
        input.value = '';
        return;
      }

      this.isUploadingDocument.set(type);
      this.profileService.uploadDocument(type, file).subscribe({
        next: (doc) => {
          this.isUploadingDocument.set(null);
          input.value = '';
          this.triggerToast(`Uploaded ${doc.title || file.name} successfully.`);
        },
        error: (err) => {
          this.isUploadingDocument.set(null);
          input.value = '';
          const msg = err?.error?.message || 'Failed to upload document. Please try again.';
          this.triggerToast(msg);
        },
      });
    }
  }

  removeDocument(docIdOrType: string): void {
    const doc = this.profile().documents.find(
      (d) => d.id === docIdOrType || d.type === docIdOrType
    );
    const targetType = doc ? doc.type : (docIdOrType as DocumentType);

    this.isDeletingDocument.set(targetType);
    this.profileService.deleteDocument(targetType).subscribe({
      next: () => {
        this.isDeletingDocument.set(null);
        this.triggerToast('Document removed.');
      },
      error: (err) => {
        this.isDeletingDocument.set(null);
        const msg = err?.error?.message || 'Failed to remove document. Please try again.';
        this.triggerToast(msg);
      },
    });
  }

  onPhotoSelected(file: File): void {
    if (!file) return;

    // Photo size validation (5 MB max)
    if (file.size > 5 * 1024 * 1024) {
      this.triggerToast('Photo is too large. Maximum allowed size is 5 MB.');
      return;
    }

    // Photo type validation
    const allowed = ['png', 'jpeg', 'jpg', 'webp'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowed.includes(ext)) {
      this.triggerToast('Unsupported image format. Please upload a PNG, JPG, or WEBP image.');
      return;
    }

    this.isUploadingPhoto.set(true);
    this.profileService.uploadPhoto(file).subscribe({
      next: () => {
        this.isUploadingPhoto.set(false);
        this.triggerToast('Profile photo updated successfully.');
      },
      error: (err) => {
        this.isUploadingPhoto.set(false);
        const msg = err?.error?.message || 'Failed to upload photo. Please try again.';
        this.triggerToast(msg);
      },
    });
  }

  onToggleDiscoverability(): void {
    const target = !this.profile().isDiscoverable;
    this.profileService.updateVisibility(target).subscribe({
      next: (res) => {
        const isNow = res?.data?.discoverable ?? target;
        this.triggerToast(
          isNow
            ? 'University Discovery Activated!'
            : 'University Discovery paused.'
        );
      },
      error: (err) => {
        const msg = err?.error?.message || 'Failed to update discovery status. Please try again.';
        this.triggerToast(msg);
      },
    });
  }

  getDocumentByType(type: DocumentType): StudentDocument | undefined {
    const doc = this.profile().documents.find((d) => d.type === type);
    return doc && (doc.status === 'UPLOADED' || doc.status === 'VERIFIED')
      ? doc
      : undefined;
  }

  private triggerToast(message: string): void {
    this.showSuccessToast.set(message);
    setTimeout(() => {
      this.showSuccessToast.set(null);
    }, 3500);
  }
}
