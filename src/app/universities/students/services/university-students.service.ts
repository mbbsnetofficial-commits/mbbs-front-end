import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UniversityAuthService } from '../../auth/services/university-auth.service';
import { UNIVERSITY_STUDENTS_API } from '../constants/university-students.constants';
import {
  StudentDiscoveryFilters,
  StudentPagination,
  UniversityStudent,
  UniversityStudentDetailResponse,
  UniversityStudentsResponse,
} from '../models/university-student.model';

@Injectable({ providedIn: 'root' })
export class UniversityStudentsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(UniversityAuthService);
  private readonly baseUrl = environment.universityApiBaseUrl;

  readonly students = signal<UniversityStudent[]>([]);
  readonly pagination = signal<StudentPagination | null>(null);
  readonly currentStudent = signal<UniversityStudent | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly currentFilters = signal<StudentDiscoveryFilters>({ page: 1, limit: 20 });

  getStudent(studentId: string): Observable<UniversityStudentDetailResponse> {
    this.loading.set(true);
    this.error.set(null);

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });

    const url = `${this.baseUrl}${UNIVERSITY_STUDENTS_API.DETAIL}/${encodeURIComponent(studentId.trim())}`;

    return this.http.get<UniversityStudentDetailResponse>(url, { headers }).pipe(
      tap((res) => {
        if (res?.success && res.data) {
          this.currentStudent.set(res.data);
        }
        this.loading.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        const errorMsg = this.extractErrorMessage(err, true);
        this.error.set(errorMsg);
        this.loading.set(false);
        return throwError(() => err);
      })
    );
  }

  getStudents(
    filters: StudentDiscoveryFilters = {}
  ): Observable<UniversityStudentsResponse> {
    this.loading.set(true);
    this.error.set(null);

    const mergedFilters: StudentDiscoveryFilters = {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      ...filters,
    };
    this.currentFilters.set(mergedFilters);

    let params = new HttpParams();

    if (mergedFilters.page !== undefined && mergedFilters.page !== null) {
      params = params.set('page', mergedFilters.page.toString());
    }

    if (mergedFilters.limit !== undefined && mergedFilters.limit !== null) {
      params = params.set('limit', mergedFilters.limit.toString());
    }

    if (mergedFilters.search && mergedFilters.search.trim()) {
      params = params.set('search', mergedFilters.search.trim());
    }

    if (mergedFilters.country && mergedFilters.country.trim()) {
      params = params.set('country', mergedFilters.country.trim());
    }

    if (mergedFilters.course && mergedFilters.course.trim()) {
      params = params.set('course', mergedFilters.course.trim());
    }

    if (
      mergedFilters.minNeetScore !== undefined &&
      mergedFilters.minNeetScore !== null &&
      !isNaN(mergedFilters.minNeetScore)
    ) {
      params = params.set('minNeetScore', mergedFilters.minNeetScore.toString());
    }

    if (
      mergedFilters.minPcb !== undefined &&
      mergedFilters.minPcb !== null &&
      !isNaN(mergedFilters.minPcb)
    ) {
      params = params.set('minPcb', mergedFilters.minPcb.toString());
    }

    if (
      mergedFilters.maxBudget !== undefined &&
      mergedFilters.maxBudget !== null &&
      !isNaN(mergedFilters.maxBudget)
    ) {
      params = params.set('maxBudget', mergedFilters.maxBudget.toString());
    }

    if (
      mergedFilters.profileCompletion !== undefined &&
      mergedFilters.profileCompletion !== null &&
      !isNaN(mergedFilters.profileCompletion)
    ) {
      params = params.set(
        'profileCompletion',
        mergedFilters.profileCompletion.toString()
      );
    }

    if (mergedFilters.sortBy) {
      params = params.set('sortBy', mergedFilters.sortBy);
    }

    if (mergedFilters.sortOrder) {
      params = params.set('sortOrder', mergedFilters.sortOrder);
    }

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });

    const url = `${this.baseUrl}${UNIVERSITY_STUDENTS_API.LIST}`;

    return this.http
      .get<UniversityStudentsResponse>(url, { headers, params })
      .pipe(
        tap((res) => {
          if (res?.success && res.data) {
            this.students.set(res.data.items || []);
            this.pagination.set(res.data.pagination || null);
          }
          this.loading.set(false);
        }),
        catchError((err: HttpErrorResponse) => {
          const errorMsg = this.extractErrorMessage(err, false);
          this.error.set(errorMsg);
          this.loading.set(false);
          return throwError(() => err);
        })
      );
  }

  private extractErrorMessage(err: HttpErrorResponse, isDetail = false): string {
    const errorBody = err.error;
    if (errorBody?.message) return errorBody.message;
    if (errorBody?.error?.message) return errorBody.error.message;
    if (typeof errorBody?.error === 'string') return errorBody.error;
    if (
      typeof errorBody === 'string' &&
      errorBody.trim().length > 0 &&
      errorBody !== err.statusText
    ) {
      return errorBody;
    }

    switch (err.status) {
      case 400:
        return isDetail
          ? 'Bad request. Invalid student identifier.'
          : 'Bad request. Invalid student search filters provided.';
      case 401:
        return 'Session expired or unauthorized. Please sign in again.';
      case 403:
        return isDetail
          ? 'You are not authorized to view this student.'
          : 'Access denied. You do not have permission to view student candidates.';
      case 404:
        return isDetail
          ? 'Student profile not found.'
          : 'Student discovery endpoint not found.';
      case 500:
        return isDetail
          ? 'Internal server error while loading student profile. Please try again.'
          : 'Internal server error while searching students. Please try again.';
      default:
        return (
          err.message ||
          'An unexpected error occurred while fetching student data.'
        );
    }
  }
}
