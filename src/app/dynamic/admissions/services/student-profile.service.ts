import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ADMISSIONS_API } from '../constants/admissions-api.constants';
import {
  AcademicInformation,
  EntranceExam,
  MbbsPreferences,
  PersonalInformation,
  SectionCompletionStatus,
  StudentDocument,
  StudentProfile,
} from '../models/student-profile.model';

export interface BackendStudentProfileResponse {
  success: boolean;
  message?: string;
  data: {
    _id?: string;
    userId?: string;
    personal?: {
      fullName?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phoneNumber?: string;
      dateOfBirth?: string;
      gender?: string;
      nationality?: string;
      city?: string;
      state?: string;
      country?: string;
      address?: string;
      pincode?: string;
      avatar?: string;
    };
    academic?: {
      tenthMarks?: number;
      tenthBoard?: string;
      tenthPassingYear?: number;
      twelfthMarks?: number;
      twelfthBoard?: string;
      twelfthPassingYear?: number;
      pcbPercentage?: number;
      physicsMarks?: number;
      chemistryMarks?: number;
      biologyMarks?: number;
      englishMarks?: number;
      schoolName?: string;
    };
    entrance?: {
      neetScore?: number;
      neetRollNumber?: string;
      neetYear?: number;
      neetQualified?: boolean;
      ucatScore?: number | null;
      otherExams?: any[];
    };
    preferences?: {
      preferredCountries?: string[];
      preferredBudgetUsd?: number;
      preferredIntake?: string | string[];
      preferredLanguage?: string;
      course?: string;
      specialization?: string;
      hostelRequired?: boolean;
      scholarshipRequired?: boolean;
    };
    documents?: Array<{
      id?: string;
      _id?: string;
      type: string;
      title?: string;
      fileName?: string;
      fileSize?: string;
      uploadedAt?: string;
      status: string;
      fileUrl?: string;
      rejectionReason?: string;
    }>;
    profileCompletion?: number;
    isDiscoverable?: boolean;
    updatedAt?: string;
  };
}

function createEmptyProfile(): StudentProfile {
  return {
    id: '',
    userId: '',
    avatarUrl: '/images/profile.jpg',
    aspirantTitle: 'MBBS Candidate',
    personal: {
      fullName: '',
      dob: '',
      gender: 'MALE',
      nationality: '',
      email: '',
      phone: '',
      city: '',
      state: '',
      country: '',
    },
    academic: {
      schoolName: '',
      boardName: '',
      tenthYear: 0,
      tenthMarks: undefined,
      tenthPercentage: undefined,
      twelfthYear: 0,
      twelfthMarks: undefined,
      physicsScore: 0,
      chemistryScore: 0,
      biologyScore: 0,
      englishScore: undefined,
      pcbPercentage: 0,
      overallPercentage: undefined,
    },
    entranceExams: [],
    preferences: {
      preferredCourse: 'MBBS',
      course: 'MBBS',
      specialization: '',
      preferredCountries: [],
      preferredIntake: [],
      preferredBudgetUsd: undefined,
      preferredLanguage: 'English',
      budgetMinInLakhs: undefined,
      budgetMaxInLakhs: undefined,
      currency: 'USD',
      hostelRequired: true,
      scholarshipRequired: true,
      preferredDurationYears: 6,
    },
    documents: [],
    completionPercentage: 0,
    sections: [],
    isDiscoverable: false,
    discoveryStatusText: '',
    updatedAt: new Date().toISOString(),
  };
}

function mapBackendProfileToFrontend(data: BackendStudentProfileResponse['data']): StudentProfile {
  const p = data?.personal || {};
  const a = data?.academic || {};
  const e = data?.entrance || {};
  const pref = data?.preferences || {};

  const fullName =
    p.fullName ||
    (p.firstName ? `${p.firstName} ${p.lastName || ''}`.trim() : '') ||
    '';
  const dob = p.dateOfBirth || '';
  const gender = (p.gender?.toUpperCase() as any) || 'MALE';

  const physics = Number(a.physicsMarks ?? 0);
  const chemistry = Number(a.chemistryMarks ?? 0);
  const biology = Number(a.biologyMarks ?? 0);
  const pcb = Number(
    a.pcbPercentage ??
      (a.physicsMarks !== undefined &&
      a.chemistryMarks !== undefined &&
      a.biologyMarks !== undefined
        ? +((physics + chemistry + biology) / 3).toFixed(2)
        : 0)
  );

  const entranceExams: EntranceExam[] = [];
  if (e.neetScore !== undefined || e.neetRollNumber) {
    entranceExams.push({
      id: 'exam-neet',
      examType: 'NEET',
      year: Number(e.neetYear) || new Date().getFullYear(),
      rollNumber: e.neetRollNumber || '',
      score: Number(e.neetScore) || 0,
      maxScore: 720,
      rank: undefined,
      percentile: undefined,
      qualified: e.neetQualified ?? false,
    });
  }

  if (e.ucatScore !== null && e.ucatScore !== undefined) {
    entranceExams.push({
      id: 'exam-ucat',
      examType: 'UCAT',
      year: new Date().getFullYear(),
      rollNumber: '',
      score: Number(e.ucatScore),
      qualified: true,
    });
  }

  const preferredIntake = Array.isArray(pref.preferredIntake)
    ? pref.preferredIntake
    : pref.preferredIntake
    ? [pref.preferredIntake]
    : [];

  const course = pref.course || 'MBBS';
  const specialization = pref.specialization || '';
  const preferredCourse = specialization
    ? `${course} (${specialization})`
    : course;

  return {
    id: data?._id || '',
    userId: data?.userId || '',
    avatarUrl: p.avatar || '/images/profile.jpg',
    aspirantTitle:
      entranceExams.length > 0
        ? `NEET ${entranceExams[0].year} Aspirant · ${preferredCourse} Candidate`
        : `${preferredCourse} Candidate`,
    personal: {
      fullName,
      dob,
      gender,
      nationality: p.nationality || '',
      email: p.email || '',
      phone: p.phoneNumber || '',
      city: p.city || '',
      state: p.state || '',
      country: p.country || '',
    },
    academic: {
      schoolName: a.schoolName || '',
      boardName: a.twelfthBoard || a.tenthBoard || '',
      tenthYear: Number(a.tenthPassingYear ?? 0),
      tenthMarks: a.tenthMarks !== undefined ? Number(a.tenthMarks) : undefined,
      tenthPercentage: undefined,
      twelfthYear: Number(a.twelfthPassingYear ?? 0),
      twelfthMarks: a.twelfthMarks !== undefined ? Number(a.twelfthMarks) : undefined,
      physicsScore: physics,
      chemistryScore: chemistry,
      biologyScore: biology,
      englishScore: a.englishMarks !== undefined ? Number(a.englishMarks) : undefined,
      pcbPercentage: pcb,
      overallPercentage: undefined,
    },
    entranceExams,
    preferences: {
      preferredCourse,
      course,
      specialization,
      preferredCountries: pref.preferredCountries || [],
      preferredIntake,
      preferredBudgetUsd:
        pref.preferredBudgetUsd !== undefined
          ? Number(pref.preferredBudgetUsd)
          : undefined,
      preferredLanguage: pref.preferredLanguage || 'English',
      budgetMinInLakhs: undefined,
      budgetMaxInLakhs: undefined,
      currency: pref.preferredBudgetUsd !== undefined ? 'USD' : 'INR',
      hostelRequired: pref.hostelRequired ?? true,
      scholarshipRequired: pref.scholarshipRequired ?? true,
      preferredDurationYears: 6,
    },
    documents: (data?.documents || []).map((doc: any) => ({
      id: doc.id || doc._id || `doc-${Date.now()}`,
      type: doc.type,
      title: doc.title || doc.type,
      fileName: doc.fileName || '',
      fileSize: doc.fileSize || '',
      uploadedAt: doc.uploadedAt || '',
      status: doc.status || 'NOT_UPLOADED',
      fileUrl: doc.fileUrl,
      rejectionReason: doc.rejectionReason,
    })),
    completionPercentage: data?.profileCompletion ?? 0,
    sections: [],
    isDiscoverable: data?.isDiscoverable ?? true,
    discoveryStatusText: '',
    updatedAt: data?.updatedAt || new Date().toISOString(),
  };
}

@Injectable({ providedIn: 'root' })
export class StudentProfileService {
  private readonly http = inject(HttpClient);
  private readonly profileUrl = `${environment.admissionsApiBaseUrl}${ADMISSIONS_API.STUDENT_PROFILE}`;

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  private readonly profileState = signal<StudentProfile>(createEmptyProfile());

  readonly profile = computed(() => {
    const p = this.profileState();
    const sections = this.calculateSections(p);
    const totalWeightedScore = sections.reduce(
      (acc, sec) =>
        acc +
        (sec.isComplete
          ? sec.weight
          : (sec.completedFields / sec.totalFields) * sec.weight),
      0
    );
    const calculatedPercentage = Math.min(100, Math.round(totalWeightedScore));
    const completionPercentage =
      p.completionPercentage > 0 ? p.completionPercentage : calculatedPercentage;
    const isDiscoverable = completionPercentage >= 70 && p.isDiscoverable;

    return {
      ...p,
      sections,
      completionPercentage,
      isDiscoverable,
      discoveryStatusText: isDiscoverable
        ? 'Active — Premier medical universities can discover your academic profile and send direct admission invites.'
        : 'Inactive — Complete remaining profile sections (minimum 70%) to become discoverable to international universities.',
    };
  });

  constructor() {
    this.loadProfile().subscribe();
  }

  loadProfile(): Observable<StudentProfile> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<BackendStudentProfileResponse>(this.profileUrl).pipe(
      map((res) => {
        const mapped = mapBackendProfileToFrontend(res?.data);
        this.profileState.set(mapped);
        this.loading.set(false);
        return mapped;
      }),
      catchError((err: HttpErrorResponse) => {
        const message =
          err.error?.message || err.message || 'Failed to load student profile';
        this.error.set(message);
        this.loading.set(false);
        return throwError(() => err);
      })
    );
  }

  getProfile(): Observable<StudentProfile> {
    if (this.profileState().id) {
      return of(this.profile());
    }
    return this.loadProfile();
  }

  updatePersonal(personal: Partial<PersonalInformation>): void {
    this.profileState.update((prev) => ({
      ...prev,
      personal: { ...prev.personal, ...personal },
      updatedAt: new Date().toISOString(),
    }));
  }

  updateAcademic(academic: Partial<AcademicInformation>): void {
    const updated = { ...this.profileState().academic, ...academic };
    if (
      updated.physicsScore !== undefined &&
      updated.chemistryScore !== undefined &&
      updated.biologyScore !== undefined
    ) {
      updated.pcbPercentage = +(
        (updated.physicsScore + updated.chemistryScore + updated.biologyScore) /
        3
      ).toFixed(2);
    }
    this.profileState.update((prev) => ({
      ...prev,
      academic: updated,
      updatedAt: new Date().toISOString(),
    }));
  }

  updateEntrance(exams: EntranceExam[]): void {
    this.profileState.update((prev) => ({
      ...prev,
      entranceExams: exams,
      updatedAt: new Date().toISOString(),
    }));
  }

  updatePreferences(preferences: Partial<MbbsPreferences>): void {
    this.profileState.update((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...preferences },
      updatedAt: new Date().toISOString(),
    }));
  }

  uploadDocument(
    type: StudentDocument['type'],
    file: { name: string; size: string }
  ): Observable<StudentDocument> {
    const newDoc: StudentDocument = {
      id: `doc-${Date.now()}`,
      type,
      title: this.getDocumentTitle(type),
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      status: 'UPLOADED',
      fileUrl: '#',
    };

    this.profileState.update((prev) => {
      const existingIndex = prev.documents.findIndex((d) => d.type === type);
      const docs = [...prev.documents];
      if (existingIndex >= 0) {
        docs[existingIndex] = newDoc;
      } else {
        docs.push(newDoc);
      }
      return {
        ...prev,
        documents: docs,
        updatedAt: new Date().toISOString(),
      };
    });

    return of(newDoc);
  }

  removeDocument(documentId: string): void {
    this.profileState.update((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.id !== documentId),
      updatedAt: new Date().toISOString(),
    }));
  }

  toggleDiscoverability(): void {
    this.profileState.update((prev) => ({
      ...prev,
      isDiscoverable: !prev.isDiscoverable,
      updatedAt: new Date().toISOString(),
    }));
  }

  private calculateSections(p: StudentProfile): SectionCompletionStatus[] {
    const personalFields = [
      p.personal.fullName,
      p.personal.dob,
      p.personal.gender,
      p.personal.nationality,
      p.personal.email,
      p.personal.phone,
      p.personal.city,
      p.personal.country,
    ];
    const personalComplete = personalFields.filter(Boolean).length;

    const academicFields = [
      p.academic.schoolName,
      p.academic.boardName,
      p.academic.tenthYear,
      p.academic.tenthMarks !== undefined || p.academic.tenthPercentage !== undefined,
      p.academic.twelfthYear,
      p.academic.physicsScore,
      p.academic.chemistryScore,
      p.academic.biologyScore,
    ];
    const academicComplete = academicFields.filter(Boolean).length;

    const hasNeet = p.entranceExams.some(
      (e) => e.examType === 'NEET' && (e.score > 0 || !!e.rollNumber)
    );

    const hasPreferences =
      p.preferences.preferredCountries.length > 0 &&
      p.preferences.preferredIntake.length > 0 &&
      (p.preferences.preferredBudgetUsd !== undefined ||
        (p.preferences.budgetMaxInLakhs !== undefined && p.preferences.budgetMaxInLakhs > 0));

    const uploadedDocs = p.documents.filter(
      (d) => d.status === 'UPLOADED' || d.status === 'VERIFIED'
    );
    const essentialDocsCount = 4;

    return [
      {
        key: 'personal',
        title: 'Personal Information',
        isComplete: personalComplete === personalFields.length,
        completedFields: personalComplete,
        totalFields: personalFields.length,
        weight: 20,
        routeAnchor: 'personal-section',
      },
      {
        key: 'academic',
        title: 'Academic Records',
        isComplete: academicComplete === academicFields.length,
        completedFields: academicComplete,
        totalFields: academicFields.length,
        weight: 25,
        routeAnchor: 'academic-section',
      },
      {
        key: 'entrance',
        title: 'NEET Scorecard & Rank',
        isComplete: hasNeet,
        completedFields: hasNeet ? 4 : 0,
        totalFields: 4,
        weight: 25,
        routeAnchor: 'entrance-section',
      },
      {
        key: 'preferences',
        title: 'MBBS Preferences',
        isComplete: hasPreferences,
        completedFields: hasPreferences ? 3 : 1,
        totalFields: 3,
        weight: 15,
        routeAnchor: 'preferences-section',
      },
      {
        key: 'documents',
        title: 'Essential Documents',
        isComplete: uploadedDocs.length >= essentialDocsCount,
        completedFields: Math.min(essentialDocsCount, uploadedDocs.length),
        totalFields: essentialDocsCount,
        weight: 15,
        routeAnchor: 'documents-section',
      },
    ];
  }

  private getDocumentTitle(type: StudentDocument['type']): string {
    switch (type) {
      case 'PASSPORT':
        return 'International Passport';
      case 'TENTH_CERTIFICATE':
        return 'Class 10th Certificate';
      case 'TWELFTH_CERTIFICATE':
        return 'Class 12th PCB Marksheet';
      case 'NEET_SCORECARD':
        return 'NEET Official Scorecard';
      case 'PHOTOGRAPH':
        return 'Passport Size Photograph';
      case 'MEDICAL_CERTIFICATE':
        return 'General Health & HIV Fitness Certificate';
      case 'POLICE_CLEARANCE':
        return 'Police Clearance Certificate (PCC)';
      default:
        return 'Supporting Document';
    }
  }
}
