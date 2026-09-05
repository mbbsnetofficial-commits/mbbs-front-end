import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ADMISSIONS_API } from '../constants/admissions-api.constants';
import {
  AcademicInformation,
  BackendDocumentItem,
  BackendDocumentUploadResponse,
  BackendPhotoUploadResponse,
  BackendStudentProfileData,
  BackendStudentProfileResponse,
  BackendVisibilityResponse,
  CreateStudentProfileRequest,
  DocumentStatus,
  DocumentType,
  EntranceExam,
  MbbsPreferences,
  PersonalInformation,
  SectionCompletionStatus,
  StudentDocument,
  StudentProfile,
} from '../models/student-profile.model';

export type { BackendStudentProfileResponse } from '../models/student-profile.model';

export function toBackendDocType(type: DocumentType): string {
  switch (type) {
    case 'PASSPORT':
      return 'passport';
    case 'TENTH_CERTIFICATE':
      return 'tenthCertificate';
    case 'TWELFTH_CERTIFICATE':
      return 'twelfthMarksheet';
    case 'NEET_SCORECARD':
      return 'neetScorecard';
    default:
      return (type || '').toLowerCase();
  }
}

export function normalizeDocStatus(status?: string): DocumentStatus {
  if (!status) return 'NOT_UPLOADED';
  const s = status.toUpperCase().replace(/\s+/g, '_');
  if (s === 'NOT_UPLOADED' || s === 'NOTUPLOADED') return 'NOT_UPLOADED';
  if (s === 'UPLOADED') return 'UPLOADED';
  if (s === 'VERIFIED') return 'VERIFIED';
  if (s === 'REJECTED') return 'REJECTED';
  if (s === 'UPLOADING') return 'UPLOADING';
  return 'NOT_UPLOADED';
}

export function mapBackendDocumentsToFrontend(docs: any): StudentDocument[] {
  const standardDocs: Array<{ type: DocumentType; key: string; defaultTitle: string }> = [
    { type: 'PASSPORT', key: 'passport', defaultTitle: 'International Passport' },
    { type: 'TENTH_CERTIFICATE', key: 'tenthCertificate', defaultTitle: 'Class 10th Certificate' },
    { type: 'TWELFTH_CERTIFICATE', key: 'twelfthMarksheet', defaultTitle: 'Class 12th PCB Marksheet' },
    { type: 'NEET_SCORECARD', key: 'neetScorecard', defaultTitle: 'NEET Official Scorecard' },
  ];

  let rawList: any[] = [];
  if (Array.isArray(docs)) {
    rawList = docs;
  } else if (docs && typeof docs === 'object') {
    rawList = Object.entries(docs).map(([key, val]: [string, any]) => ({
      ...val,
      docKey: key,
      documentType: val?.documentType || key,
    }));
  }

  return standardDocs.map((def) => {
    const found = rawList.find((d) => {
      const t = (d?.type || d?.documentType || d?.docKey || '').toLowerCase();
      return (
        t === def.key.toLowerCase() ||
        t === def.type.toLowerCase() ||
        (def.key === 'twelfthMarksheet' && (t.includes('twelfth') || t.includes('12th') || t.includes('pcb'))) ||
        (def.key === 'tenthCertificate' && (t.includes('tenth') || t.includes('10th'))) ||
        (def.key === 'neetScorecard' && t.includes('neet')) ||
        (def.key === 'passport' && t.includes('passport'))
      );
    });

    const status = normalizeDocStatus(found?.status);
    const url = found?.url || found?.fileUrl || '';

    return {
      id: found?.id || found?._id || found?.publicId || `doc-${def.key}`,
      type: def.type,
      title: found?.name || found?.title || def.defaultTitle,
      fileName: found?.fileName || (url ? url.substring(url.lastIndexOf('/') + 1) : ''),
      fileSize: found?.fileSize || '',
      uploadedAt: found?.uploadedAt || '',
      status,
      fileUrl: url,
      rejectionReason: found?.rejectionReason,
    };
  });
}

function createEmptyProfile(): StudentProfile {
  return {
    id: '',
    userId: '',
    avatarUrl: '',
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
      tenthYear: undefined,
      tenthMarks: undefined,
      tenthPercentage: undefined,
      twelfthYear: undefined,
      twelfthMarks: undefined,
      physicsScore: undefined,
      chemistryScore: undefined,
      biologyScore: undefined,
      englishScore: undefined,
      pcbPercentage: undefined,
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
      preferredLanguage: '',
      budgetMinInLakhs: undefined,
      budgetMaxInLakhs: undefined,
      currency: 'USD',
      hostelRequired: undefined,
      scholarshipRequired: undefined,
      preferredDurationYears: undefined,
    },
    documents: mapBackendDocumentsToFrontend(null),
    completionPercentage: 0,
    sections: [],
    isDiscoverable: false,
    discoveryStatusText: 'Inactive — Profile is currently not discoverable by universities.',
    updatedAt: '',
  };
}

export function mapBackendProfileToFrontend(data: BackendStudentProfileData | any): StudentProfile {
  const p = data?.personal || {};
  const a = data?.academic || {};
  const e = data?.entrance || {};
  const pref = data?.preferences || {};

  // 1. Personal Information Mapping
  const fullName =
    p.fullName ||
    (p.firstName ? `${p.firstName} ${p.lastName || ''}`.trim() : '') ||
    '';
  const dob = p.dateOfBirth || p.dob || p.dateOfBirthFormatted || '';
  
  let gender: 'MALE' | 'FEMALE' | 'OTHER' = 'MALE';
  if (p.gender) {
    const gUpper = p.gender.toUpperCase();
    if (gUpper === 'FEMALE') gender = 'FEMALE';
    else if (gUpper === 'OTHER') gender = 'OTHER';
    else gender = 'MALE';
  }

  // 2. Academic Records Mapping
  const physics =
    a.physicsMarks !== undefined
      ? Number(a.physicsMarks)
      : (a.physicsScore !== undefined ? Number(a.physicsScore) : undefined);
  const chemistry =
    a.chemistryMarks !== undefined
      ? Number(a.chemistryMarks)
      : (a.chemistryScore !== undefined ? Number(a.chemistryScore) : undefined);
  const biology =
    a.biologyMarks !== undefined
      ? Number(a.biologyMarks)
      : (a.biologyScore !== undefined ? Number(a.biologyScore) : undefined);
  const english =
    a.englishMarks !== undefined
      ? Number(a.englishMarks)
      : (a.englishScore !== undefined ? Number(a.englishScore) : undefined);

  let pcb: number | undefined = undefined;
  if (a.pcbAggregate !== undefined) {
    pcb = Number(a.pcbAggregate);
  } else if (a.pcbPercentage !== undefined) {
    pcb = Number(a.pcbPercentage);
  } else if (physics !== undefined && chemistry !== undefined && biology !== undefined) {
    pcb = +((physics + chemistry + biology) / 3).toFixed(2);
  }

  const twelfthYear =
    a.twelfthPassingYear !== undefined
      ? Number(a.twelfthPassingYear)
      : (a.twelfthYear !== undefined ? Number(a.twelfthYear) : undefined);
  const twelfthMarks =
    a.twelfthMarks !== undefined ? Number(a.twelfthMarks) : undefined;
  const tenthYear =
    a.tenthPassingYear !== undefined
      ? Number(a.tenthPassingYear)
      : (a.tenthYear !== undefined ? Number(a.tenthYear) : undefined);
  const tenthMarks =
    a.tenthMarks !== undefined ? Number(a.tenthMarks) : undefined;

  // 3. Entrance Examination Mapping
  const entranceExams: EntranceExam[] = [];
  const examsList = Array.isArray(e.exams)
    ? e.exams
    : (Array.isArray(data?.entranceExams) ? data.entranceExams : []);
  const neetInList = examsList.find(
    (ex: any) => !ex.examType || (ex.examType || '').toUpperCase() === 'NEET'
  );

  if (neetInList) {
    entranceExams.push({
      id: neetInList.id || 'exam-neet',
      examType: neetInList.examType || 'NEET',
      year:
        neetInList.examYear !== undefined
          ? Number(neetInList.examYear)
          : (neetInList.year !== undefined ? Number(neetInList.year) : undefined),
      rollNumber: neetInList.rollNumber || '',
      score: neetInList.score !== undefined ? Number(neetInList.score) : undefined,
      maxScore:
        neetInList.maxScore !== undefined
          ? Number(neetInList.maxScore)
          : (neetInList.maximumScore !== undefined ? Number(neetInList.maximumScore) : 720),
      rank: neetInList.rank !== undefined ? Number(neetInList.rank) : undefined,
      percentile: neetInList.percentile !== undefined ? Number(neetInList.percentile) : undefined,
      qualified: neetInList.qualified ?? false,
    });
  } else if (
    e.examType ||
    e.examYear !== undefined ||
    e.rollNumber ||
    e.score !== undefined ||
    e.neetScore !== undefined ||
    e.neetRollNumber
  ) {
    const scoreVal =
      e.score !== undefined
        ? Number(e.score)
        : (e.neetScore !== undefined ? Number(e.neetScore) : undefined);
    const yearVal =
      e.examYear !== undefined
        ? Number(e.examYear)
        : (e.neetYear !== undefined ? Number(e.neetYear) : undefined);
    const rollVal = e.rollNumber || e.neetRollNumber || '';
    const qualVal = e.qualified ?? e.neetQualified ?? false;
    const maxScoreVal =
      e.maximumScore !== undefined ? Number(e.maximumScore) : 720;

    entranceExams.push({
      id: 'exam-neet',
      examType: 'NEET',
      year: yearVal,
      rollNumber: rollVal,
      score: scoreVal,
      maxScore: maxScoreVal,
      qualified: qualVal,
    });
  }

  for (const other of examsList) {
    if ((other.examType || '').toUpperCase() !== 'NEET') {
      entranceExams.push({
        id: other.id || `exam-${other.examType || 'other'}`,
        examType: other.examType || 'OTHER',
        year: other.examYear !== undefined ? Number(other.examYear) : other.year,
        rollNumber: other.rollNumber || '',
        score: other.score !== undefined ? Number(other.score) : undefined,
        maxScore:
          other.maxScore !== undefined ? Number(other.maxScore) : other.maximumScore,
        qualified: other.qualified ?? false,
      });
    }
  }

  if (
    e.ucatScore !== null &&
    e.ucatScore !== undefined &&
    !entranceExams.some((x) => x.examType === 'UCAT')
  ) {
    entranceExams.push({
      id: 'exam-ucat',
      examType: 'UCAT',
      year: undefined,
      rollNumber: '',
      score: Number(e.ucatScore),
      qualified: true,
    });
  }

  // 4. Preferences Mapping
  let preferredIntake: string[] = [];
  if (Array.isArray(pref.preferredIntake)) {
    preferredIntake = pref.preferredIntake;
  } else if (typeof pref.preferredIntake === 'string' && pref.preferredIntake.trim()) {
    preferredIntake = [pref.preferredIntake.trim()];
  } else if (Array.isArray(pref.targetIntake)) {
    preferredIntake = pref.targetIntake;
  } else if (typeof pref.targetIntake === 'string' && pref.targetIntake.trim()) {
    preferredIntake = [pref.targetIntake.trim()];
  }

  let preferredBudgetUsd: number | undefined = undefined;
  if (pref.preferredBudgetUsd !== undefined) {
    preferredBudgetUsd = Number(pref.preferredBudgetUsd);
  } else if (typeof pref.annualBudget === 'number') {
    preferredBudgetUsd = pref.annualBudget;
  } else if (typeof pref.annualBudget === 'string') {
    const parsed = parseFloat(pref.annualBudget.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed)) {
      preferredBudgetUsd = parsed;
    }
  }

  const preferredLanguage =
    pref.preferredLanguage || pref.instructionMedium || '';
  const course = pref.course || 'MBBS';
  const specialization = pref.specialization || '';
  const preferredCourse = specialization
    ? `${course} (${specialization})`
    : course;

  // 5. Visibility / Discoverability
  const isDiscoverable =
    data?.visibility?.discoverable ?? data?.isDiscoverable ?? false;
  const discoveryStatusText =
    data?.visibility?.displayText ||
    (isDiscoverable
      ? 'Active — Profile is discoverable by universities.'
      : 'Inactive — Profile is currently not discoverable by universities.');

  // 6. Documents
  const documents = mapBackendDocumentsToFrontend(data?.documents);

  return {
    id: data?._id || data?.id || data?.studentId || '',
    userId: data?.studentId || data?.userId || '',
    avatarUrl:
      (data?.avatarUrl && data?.avatarUrl !== '/images/profile.jpg' ? data.avatarUrl : '') ||
      (p.avatar && p.avatar !== '/images/profile.jpg' ? p.avatar : '') ||
      '',
    aspirantTitle:
      entranceExams.length > 0 && entranceExams[0].year
        ? `NEET ${entranceExams[0].year} Aspirant · ${preferredCourse} Candidate`
        : `${preferredCourse} Candidate`,
    personal: {
      fullName,
      dob,
      gender,
      nationality: p.nationality || '',
      email: p.email || '',
      phone: p.phoneNumber || p.phone || '',
      city: p.city || '',
      state: p.state || '',
      country: p.country || '',
    },
    academic: {
      schoolName: a.schoolName || '',
      boardName: a.boardOfEducation || a.twelfthBoard || a.boardName || a.tenthBoard || '',
      tenthYear,
      tenthMarks,
      tenthPercentage: undefined,
      twelfthYear,
      twelfthMarks,
      physicsScore: physics,
      chemistryScore: chemistry,
      biologyScore: biology,
      englishScore: english,
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
      preferredBudgetUsd,
      preferredLanguage,
      budgetMinInLakhs: undefined,
      budgetMaxInLakhs: undefined,
      currency: preferredBudgetUsd !== undefined ? 'USD' : 'INR',
      hostelRequired:
        pref.hostelRequired !== undefined ? pref.hostelRequired : undefined,
      scholarshipRequired:
        pref.scholarshipRequired !== undefined
          ? pref.scholarshipRequired
          : undefined,
      preferredDurationYears: undefined,
    },
    documents,
    completionPercentage: data?.profileCompletion ?? data?.completionPercentage ?? 0,
    sections: [],
    isDiscoverable,
    discoveryStatusText,
    updatedAt: data?.updatedAt || '',
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
    const isDiscoverable = p.isDiscoverable;

    return {
      ...p,
      sections,
      isDiscoverable,
      discoveryStatusText: p.discoveryStatusText || (isDiscoverable
        ? 'Active — Profile is discoverable by universities.'
        : 'Inactive — Profile is currently not discoverable by universities.'),
    };
  });

  constructor() {
    this.loadProfile().subscribe({
      error: () => {
        // Silently handled by error signal
      },
    });
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

  updateProfile(payload: Record<string, any>): Observable<StudentProfile> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.put<BackendStudentProfileResponse>(this.profileUrl, payload).pipe(
      map((res) => {
        const mapped = mapBackendProfileToFrontend(res?.data);
        this.profileState.set(mapped);
        this.loading.set(false);
        return mapped;
      }),
      catchError((err: HttpErrorResponse) => {
        const message =
          err.error?.message || err.message || 'Failed to update student profile';
        this.error.set(message);
        this.loading.set(false);
        return throwError(() => err);
      })
    );
  }

  updatePersonal(personal: Partial<PersonalInformation>): Observable<StudentProfile> {
    const payload: Record<string, any> = {
      fullName: personal.fullName,
      dateOfBirth: personal.dob,
      nationality: personal.nationality,
      city: personal.city,
      state: personal.state,
      country: personal.country,
    };

    if (personal.gender) {
      payload['gender'] =
        personal.gender.charAt(0).toUpperCase() +
        personal.gender.slice(1).toLowerCase();
    }

    if (personal.email) {
      payload['email'] = personal.email;
    }

    if (personal.phone) {
      payload['phone'] = personal.phone;
      payload['phoneNumber'] = personal.phone;
    }

    return this.updateProfile(payload);
  }

  updateAcademic(academic: Partial<AcademicInformation>): Observable<StudentProfile> {
    const payload: Record<string, any> = {
      schoolName: academic.schoolName,
      boardOfEducation: academic.boardName,
      twelfthBoard: academic.boardName,
      twelfthPassingYear:
        academic.twelfthYear !== undefined
          ? Number(academic.twelfthYear)
          : undefined,
      physicsMarks:
        academic.physicsScore !== undefined
          ? Number(academic.physicsScore)
          : undefined,
      chemistryMarks:
        academic.chemistryScore !== undefined
          ? Number(academic.chemistryScore)
          : undefined,
      biologyMarks:
        academic.biologyScore !== undefined
          ? Number(academic.biologyScore)
          : undefined,
      englishMarks:
        academic.englishScore !== undefined
          ? Number(academic.englishScore)
          : undefined,
    };

    return this.updateProfile(payload);
  }

  updateEntrance(exams: EntranceExam[]): Observable<StudentProfile> {
    const neet = (exams || []).find(
      (e) => (e.examType || '').toUpperCase() === 'NEET'
    ) || (exams && exams.length > 0 ? exams[0] : null);

    const payload: Record<string, any> = {
      examType: neet?.examType || 'NEET',
      examYear: neet?.year !== undefined ? Number(neet.year) : undefined,
      rollNumber: neet?.rollNumber || '',
      score: neet?.score !== undefined ? Number(neet.score) : undefined,
      qualified: neet?.qualified ?? false,
    };

    return this.updateProfile(payload);
  }

  updatePreferences(preferences: Partial<MbbsPreferences>): Observable<StudentProfile> {
    const intake =
      preferences.preferredIntake && preferences.preferredIntake.length > 0
        ? preferences.preferredIntake[0]
        : undefined;

    const budget =
      preferences.preferredBudgetUsd !== undefined
        ? Number(preferences.preferredBudgetUsd)
        : undefined;

    const payload: Record<string, any> = {
      preferredCountries: preferences.preferredCountries || [],
      targetIntake: intake,
      preferredIntake: intake,
      preferredBudgetUsd: budget,
      annualBudget: budget !== undefined ? `${budget} USD` : undefined,
      instructionMedium: preferences.preferredLanguage || undefined,
      preferredLanguage: preferences.preferredLanguage || undefined,
      hostelRequired: preferences.hostelRequired,
    };

    return this.updateProfile(payload);
  }

  updateVisibility(discoverable: boolean): Observable<BackendVisibilityResponse> {
    const url = `${environment.admissionsApiBaseUrl}${ADMISSIONS_API.STUDENT_PROFILE_VISIBILITY}`;

    return this.http.patch<BackendVisibilityResponse>(url, { discoverable }).pipe(
      tap((res) => {
        const isDisc = res?.data?.discoverable ?? discoverable;
        const dispText =
          res?.data?.displayText ||
          (isDisc
            ? 'Active — Profile is discoverable by universities.'
            : 'Inactive — Profile is currently not discoverable by universities.');

        this.profileState.update((prev) => ({
          ...prev,
          isDiscoverable: isDisc,
          discoveryStatusText: dispText,
          updatedAt: new Date().toISOString(),
        }));
      })
    );
  }

  toggleDiscoverability(): Observable<BackendVisibilityResponse> {
    const current = this.profileState().isDiscoverable;
    return this.updateVisibility(!current);
  }

  uploadDocument(type: DocumentType, file: File): Observable<StudentDocument> {
    const backendType = toBackendDocType(type);
    const url = `${environment.admissionsApiBaseUrl}${ADMISSIONS_API.STUDENT_PROFILE_DOCUMENTS}/${backendType}`;
    const formData = new FormData();
    formData.append('document', file, file.name);

    return this.http.post<BackendDocumentUploadResponse>(url, formData).pipe(
      map((res) => {
        const docData = res?.data;
        const uploadedDoc: StudentDocument = {
          id: docData?.id || docData?._id || docData?.publicId || `doc-${Date.now()}`,
          type,
          title: docData?.name || docData?.title || this.getDocumentTitle(type),
          fileName: docData?.fileName || file.name,
          fileSize:
            docData?.fileSize || `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          uploadedAt: docData?.uploadedAt || new Date().toISOString(),
          status: normalizeDocStatus(docData?.status || 'Uploaded'),
          fileUrl: docData?.url || docData?.fileUrl || '',
          rejectionReason: docData?.rejectionReason,
        };

        this.profileState.update((prev) => {
          const docs = [...prev.documents];
          const existingIndex = docs.findIndex((d) => d.type === type);
          if (existingIndex >= 0) {
            docs[existingIndex] = uploadedDoc;
          } else {
            docs.push(uploadedDoc);
          }
          return {
            ...prev,
            documents: docs,
            updatedAt: new Date().toISOString(),
          };
        });

        return uploadedDoc;
      })
    );
  }

  deleteDocument(type: DocumentType): Observable<void> {
    const backendType = toBackendDocType(type);
    const url = `${environment.admissionsApiBaseUrl}${ADMISSIONS_API.STUDENT_PROFILE_DOCUMENTS}/${backendType}`;

    return this.http.delete<any>(url).pipe(
      map(() => {
        this.profileState.update((prev) => {
          const docs = prev.documents.map((d) => {
            if (d.type === type) {
              return {
                ...d,
                status: 'NOT_UPLOADED' as DocumentStatus,
                fileUrl: '',
                fileName: '',
                fileSize: '',
                uploadedAt: undefined,
              };
            }
            return d;
          });
          return {
            ...prev,
            documents: docs,
            updatedAt: new Date().toISOString(),
          };
        });
      })
    );
  }

  removeDocument(documentIdOrType: string): Observable<void> {
    const doc = this.profileState().documents.find(
      (d) => d.id === documentIdOrType || d.type === documentIdOrType
    );
    const targetType = doc ? doc.type : (documentIdOrType as DocumentType);
    return this.deleteDocument(targetType);
  }

  uploadPhoto(file: File): Observable<{ url: string }> {
    const url = `${environment.admissionsApiBaseUrl}${ADMISSIONS_API.STUDENT_PROFILE_PHOTO}`;
    const formData = new FormData();
    formData.append('photo', file, file.name);

    return this.http.post<BackendPhotoUploadResponse>(url, formData).pipe(
      map((res) => {
        const photoUrl =
          res?.data?.url || res?.data?.avatarUrl || res?.data?.avatar || '';
        if (photoUrl) {
          this.profileState.update((prev) => ({
            ...prev,
            avatarUrl: photoUrl,
            updatedAt: new Date().toISOString(),
          }));
        }
        return { url: photoUrl };
      })
    );
  }

  createProfile(payload: CreateStudentProfileRequest): Observable<StudentProfile> {
    this.loading.set(true);
    this.error.set(null);

    return this.http
      .post<BackendStudentProfileResponse>(this.profileUrl, payload)
      .pipe(
        map((res) => {
          const mapped = mapBackendProfileToFrontend(res?.data);
          this.profileState.set(mapped);
          this.loading.set(false);
          return mapped;
        }),
        catchError((err: HttpErrorResponse) => {
          const message =
            err.error?.message || err.message || 'Failed to create student profile';
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

  private calculateSections(p: StudentProfile): SectionCompletionStatus[] {
    const personalComplete = Boolean(
      p.personal.fullName && (p.personal.email || p.personal.phone)
    );

    const academicComplete = Boolean(
      p.academic.schoolName ||
        p.academic.boardName ||
        p.academic.twelfthMarks !== undefined ||
        p.academic.pcbPercentage !== undefined
    );

    const hasNeet = p.entranceExams.some(
      (e) => e.examType === 'NEET' && (e.score !== undefined || !!e.rollNumber)
    );

    const hasPreferences = Boolean(
      (p.preferences.preferredCountries &&
        p.preferences.preferredCountries.length > 0) ||
        p.preferences.preferredBudgetUsd !== undefined ||
        (p.preferences.preferredIntake && p.preferences.preferredIntake.length > 0)
    );

    const uploadedDocs = (p.documents || []).filter(
      (d) => d.status === 'UPLOADED' || d.status === 'VERIFIED'
    );

    return [
      {
        key: 'personal',
        title: 'Personal Information',
        isComplete: personalComplete,
        routeAnchor: 'personal-section',
      },
      {
        key: 'academic',
        title: 'Academic Records',
        isComplete: academicComplete,
        routeAnchor: 'academic-section',
      },
      {
        key: 'entrance',
        title: 'NEET Scorecard & Rank',
        isComplete: hasNeet,
        routeAnchor: 'entrance-section',
      },
      {
        key: 'preferences',
        title: 'MBBS Preferences',
        isComplete: hasPreferences,
        routeAnchor: 'preferences-section',
      },
      {
        key: 'documents',
        title: 'Essential Documents',
        isComplete: uploadedDocs.length > 0,
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
