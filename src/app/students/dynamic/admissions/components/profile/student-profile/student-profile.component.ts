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

  // Date of Birth Helpers & Structured Process
  readonly monthsList = [
    { value: '01', name: '01 - January', short: 'Jan' },
    { value: '02', name: '02 - February', short: 'Feb' },
    { value: '03', name: '03 - March', short: 'Mar' },
    { value: '04', name: '04 - April', short: 'Apr' },
    { value: '05', name: '05 - May', short: 'May' },
    { value: '06', name: '06 - June', short: 'Jun' },
    { value: '07', name: '07 - July', short: 'Jul' },
    { value: '08', name: '08 - August', short: 'Aug' },
    { value: '09', name: '09 - September', short: 'Sep' },
    { value: '10', name: '10 - October', short: 'Oct' },
    { value: '11', name: '11 - November', short: 'Nov' },
    { value: '12', name: '12 - December', short: 'Dec' },
  ];

  // Eligible birth years: 2011 down to 1960 (strictly prevents future dates like 2026)
  readonly birthYears = Array.from({ length: 2011 - 1960 + 1 }, (_, i) => 2011 - i);

  // Common student birth years for 1-click quick-selection
  readonly popularStudentYears = [2008, 2007, 2006, 2005, 2004, 2003, 2002, 2001, 2000];

  readonly dobDay = signal<string>('');
  readonly dobMonth = signal<string>('');
  readonly dobYear = signal<string>('');

  // Dynamically calculates days in the selected month & year (supports leap years)
  readonly daysInMonth = computed(() => {
    const m = parseInt(this.dobMonth(), 10);
    const y = parseInt(this.dobYear(), 10);
    if (!m) return Array.from({ length: 31 }, (_, i) => i + 1);

    if (m === 2) {
      if (y && ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0)) {
        return Array.from({ length: 29 }, (_, i) => i + 1);
      }
      return Array.from({ length: 28 }, (_, i) => i + 1);
    }
    if ([4, 6, 9, 11].includes(m)) {
      return Array.from({ length: 30 }, (_, i) => i + 1);
    }
    return Array.from({ length: 31 }, (_, i) => i + 1);
  });

  // Computed age for live applicant guidance
  readonly dobAge = computed<number | null>(() => {
    const y = parseInt(this.dobYear(), 10);
    const m = parseInt(this.dobMonth(), 10);
    const d = parseInt(this.dobDay(), 10);
    if (!y || !m || !d) return null;

    const birthDate = new Date(y, m - 1, d);
    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 && age <= 120 ? age : null;
  });

  // Verification preview for process clarity
  readonly formattedDobPreview = computed<string | null>(() => {
    const y = parseInt(this.dobYear(), 10);
    const m = parseInt(this.dobMonth(), 10);
    const d = parseInt(this.dobDay(), 10);
    if (!y || !m || !d) return null;

    const monthObj = this.monthsList.find((mo) => mo.value === this.dobMonth());
    const monthShort = monthObj ? monthObj.short : '';
    const dayPadded = String(d).padStart(2, '0');
    const monthPadded = String(m).padStart(2, '0');

    return `${dayPadded} ${monthShort} ${y} (Document Format: ${dayPadded}-${monthPadded}-${y})`;
  });

  // Eligibility check for MBBS admissions (typically minimum 17 years old)
  readonly isMbbsAgeEligible = computed<boolean | null>(() => {
    const age = this.dobAge();
    if (age === null) return null;
    return age >= 17;
  });

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

  getAge(dobStr?: string | null): number | null {
    if (!dobStr) return null;
    const parts = dobStr.split(/[-/T ]/);
    let birth: Date;
    if (parts.length >= 3 && parts[0].length === 4) {
      birth = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2].slice(0, 2), 10));
    } else if (parts.length >= 3 && parts[2].length === 4) {
      birth = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    } else {
      birth = new Date(dobStr);
    }
    if (isNaN(birth.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 && age <= 120 ? age : null;
  }

  initDobFromDraft(val?: string | null): void {
    const raw = val !== undefined ? val : this.personalDraft.dob;
    if (!raw) {
      this.dobDay.set('');
      this.dobMonth.set('');
      this.dobYear.set('');
      return;
    }

    const parts = raw.split(/[-/T ]/);
    if (parts.length >= 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        this.dobYear.set(parts[0]);
        this.dobMonth.set(parts[1].padStart(2, '0'));
        this.dobDay.set(parts[2].slice(0, 2).padStart(2, '0'));
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY
        this.dobDay.set(parts[0].padStart(2, '0'));
        this.dobMonth.set(parts[1].padStart(2, '0'));
        this.dobYear.set(parts[2]);
      }
    }
  }

  onDobPartsChanged(): void {
    const d = this.dobDay();
    const m = this.dobMonth();
    const y = this.dobYear();

    if (d && m) {
      const maxDays = this.daysInMonth().length;
      if (parseInt(d, 10) > maxDays) {
        this.dobDay.set(String(maxDays).padStart(2, '0'));
      }
    }

    if (this.dobDay() && this.dobMonth() && this.dobYear()) {
      const dayPadded = String(this.dobDay()).padStart(2, '0');
      const monthPadded = String(this.dobMonth()).padStart(2, '0');
      this.personalDraft.dob = `${this.dobYear()}-${monthPadded}-${dayPadded}`;
    }
  }

  selectPopularYear(year: number): void {
    this.dobYear.set(String(year));
    this.onDobPartsChanged();
  }

  // Personal
  startEditPersonal(): void {
    this.personalDraft = { ...this.profile().personal };
    this.initDobFromDraft(this.personalDraft.dob);
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
    const rawExams: EntranceExam[] = JSON.parse(JSON.stringify(this.profile().entranceExams || []));
    const neet = rawExams.find((x) => (x.examType || '').toUpperCase() === 'NEET') || rawExams[0];
    if (neet) {
      const canonicalRoll = (neet.rollNumber || '').trim().toLowerCase();
      const others = rawExams.filter((x) => {
        if (x === neet) return false;
        if ((x.examType || '').toUpperCase() === 'NEET') return false;
        const roll = (x.rollNumber || '').trim().toLowerCase();
        if (canonicalRoll && roll && canonicalRoll === roll) return false;
        if (roll.startsWith('neet')) return false;
        if ((x.examType || '').toUpperCase() === 'OTHER' && (!roll || (x.score === neet.score && x.year === neet.year))) return false;
        return true;
      });
      this.entranceDraft = [{ ...neet, examType: 'NEET' }, ...others];
    } else {
      this.entranceDraft = [
        {
          id: 'exam-neet',
          examType: 'NEET',
          year: undefined,
          score: undefined,
          maxScore: 720,
          rollNumber: '',
          qualified: false,
        },
      ];
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
