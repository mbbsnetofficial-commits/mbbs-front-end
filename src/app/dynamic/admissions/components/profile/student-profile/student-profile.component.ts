import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { StudentProfileService } from '../../../services/student-profile.service';
import { ProfileHeaderComponent } from '../profile-header/profile-header';
import { Icon } from '../../../../../shared/ui/icon/icon';
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

  // Personal
  startEditPersonal(): void {
    this.personalDraft = { ...this.profile().personal };
    this.editingPersonal.set(true);
  }
  cancelEditPersonal(): void {
    this.editingPersonal.set(false);
  }
  savePersonal(): void {
    this.profileService.updatePersonal(this.personalDraft);
    this.editingPersonal.set(false);
    this.triggerToast('Personal details updated successfully.');
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
    this.profileService.updateAcademic(this.academicDraft);
    this.editingAcademic.set(false);
    this.triggerToast('Academic records updated successfully.');
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
    this.profileService.updateEntrance(this.entranceDraft);
    this.editingEntrance.set(false);
    this.triggerToast('NEET & Entrance examination scores updated.');
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
    this.profileService.updatePreferences(this.preferencesDraft);
    this.editingPreferences.set(false);
    this.triggerToast('MBBS matching preferences updated.');
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
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
      this.profileService.uploadDocument(type, { name: file.name, size: sizeStr });
      this.triggerToast(`Uploaded ${file.name} successfully.`);
    }
  }

  removeDocument(docId: string): void {
    this.profileService.removeDocument(docId);
    this.triggerToast('Document removed.');
  }

  onToggleDiscoverability(): void {
    this.profileService.toggleDiscoverability();
    const isNow = this.profile().isDiscoverable;
    this.triggerToast(
      isNow
        ? 'University Discovery Activated!'
        : 'University Discovery paused.'
    );
  }

  getDocumentByType(type: DocumentType): StudentDocument | undefined {
    return this.profile().documents.find((d) => d.type === type);
  }

  private triggerToast(message: string): void {
    this.showSuccessToast.set(message);
    setTimeout(() => {
      this.showSuccessToast.set(null);
    }, 3500);
  }
}
