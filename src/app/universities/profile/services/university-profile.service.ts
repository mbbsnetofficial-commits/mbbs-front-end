import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UniversityAuthService } from '../../auth/services/university-auth.service';
import { UNIVERSITY_PROFILE_API } from '../constants/university-profile.constants';
import {
  UniversityProfile,
  UniversityProfileResponse,
  UpdateUniversityProfileRequest,
  UpdateUniversityProfileResponse,
} from '../models/university-profile.model';

@Injectable({ providedIn: 'root' })
export class UniversityProfileService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(UniversityAuthService);
  private readonly baseUrl = environment.universityApiBaseUrl;

  readonly profile = signal<UniversityProfile | null>(null);
  readonly loading = signal<boolean>(false);
  readonly updating = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  private readonly IMAGES_STORAGE_KEY = 'mbbs_univ_profile_custom_images';

  private getStoredImages(orgId: string): { logo?: string | null; coverImage?: string | null } | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem(`${this.IMAGES_STORAGE_KEY}_${orgId}`);
      if (raw) return JSON.parse(raw);
      const fallback =
        localStorage.getItem(`${this.IMAGES_STORAGE_KEY}_tsmu`) ||
        localStorage.getItem(`${this.IMAGES_STORAGE_KEY}_ORG_TSMU_001`) ||
        localStorage.getItem(`${this.IMAGES_STORAGE_KEY}_default`);
      if (fallback) return JSON.parse(fallback);
      const genericLogo = localStorage.getItem('mbbs_univ_custom_logo');
      const genericCover = localStorage.getItem('mbbs_univ_custom_cover');
      if (genericLogo || genericCover) {
        return { logo: genericLogo, coverImage: genericCover };
      }
      return null;
    } catch {
      return null;
    }
  }

  private setStoredImages(orgId: string, images: { logo?: string | null; coverImage?: string | null }): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const serialized = JSON.stringify(images);
      localStorage.setItem(`${this.IMAGES_STORAGE_KEY}_${orgId}`, serialized);
      localStorage.setItem(`${this.IMAGES_STORAGE_KEY}_tsmu`, serialized);
      localStorage.setItem(`${this.IMAGES_STORAGE_KEY}_ORG_TSMU_001`, serialized);
      localStorage.setItem(`${this.IMAGES_STORAGE_KEY}_default`, serialized);
      if (images.logo) {
        localStorage.setItem('mbbs_univ_custom_logo', images.logo);
      }
      if (images.coverImage) {
        localStorage.setItem('mbbs_univ_custom_cover', images.coverImage);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('mbbs:university:profile-updated', {
            detail: { orgId, ...images },
          })
        );
      }
    } catch {
      // ignore
    }
  }

  // API #17: GET /organization/profile (View Profile)
  getProfile(): Observable<UniversityProfileResponse> {
    this.loading.set(true);
    this.error.set(null);

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });

    const url = `${this.baseUrl}${UNIVERSITY_PROFILE_API.PROFILE}`;

    return this.http.get<UniversityProfileResponse>(url, { headers }).pipe(
      tap((res) => {
        if (res?.success && res.data) {
          const stored = this.getStoredImages(res.data.organizationId);
          const merged: UniversityProfile = {
            ...res.data,
            logo: stored?.logo !== undefined ? stored.logo : res.data.logo,
            coverImage: stored?.coverImage !== undefined ? stored.coverImage : res.data.coverImage,
          };
          this.profile.set(merged);
        }
        this.loading.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        const errorMsg = this.extractErrorMessage(err, 'get');
        this.error.set(errorMsg);
        this.loading.set(false);
        return throwError(() => err);
      })
    );
  }

  // API #18: PUT /organization/profile (Update Profile)
  updateProfile(
    payload: UpdateUniversityProfileRequest
  ): Observable<UpdateUniversityProfileResponse> {
    this.updating.set(true);
    this.error.set(null);

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    });

    const url = `${this.baseUrl}${UNIVERSITY_PROFILE_API.PROFILE}`;

    return this.http
      .put<UpdateUniversityProfileResponse>(url, payload, { headers })
      .pipe(
        tap((res) => {
          if (res?.success && res.data) {
            const orgId = res.data.organizationId || this.profile()?.organizationId || 'default';
            if (payload.logo !== undefined || payload.coverImage !== undefined) {
              this.setStoredImages(orgId, {
                logo: payload.logo ?? res.data.logo,
                coverImage: payload.coverImage ?? res.data.coverImage,
              });
            }
            const stored = this.getStoredImages(orgId);
            const merged: UniversityProfile = {
              ...res.data,
              logo: stored?.logo !== undefined ? stored.logo : res.data.logo,
              coverImage: stored?.coverImage !== undefined ? stored.coverImage : res.data.coverImage,
            };
            this.profile.set(merged);
          }
          this.updating.set(false);
        }),
        catchError((err: HttpErrorResponse) => {
          const errorMsg = this.extractErrorMessage(err, 'update');
          this.error.set(errorMsg);
          this.updating.set(false);
          return throwError(() => err);
        })
      );
  }

  private extractErrorMessage(
    err: HttpErrorResponse,
    action: 'get' | 'update' = 'get'
  ): string {
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
        return 'Bad request. Please verify all profile fields.';
      case 401:
        return 'Session expired or unauthorized. Please sign in again.';
      case 403:
        return 'Access denied. You do not have permission to view or edit the organization profile.';
      case 404:
        return 'Organization profile not found.';
      case 409:
        return 'Conflict: An organization profile update conflict occurred.';
      case 500:
        return 'Internal server error while processing profile request. Please try again.';
      default:
        return (
          err.message ||
          'An unexpected error occurred while communicating with organization profile backend.'
        );
    }
  }
}
