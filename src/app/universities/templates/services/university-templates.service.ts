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
import { UNIVERSITY_TEMPLATES_API } from '../constants/university-templates.constants';
import {
  CreateTemplateRequest,
  CreateTemplateResponse,
  DeleteTemplateResponse,
  SingleTemplateResponse,
  TemplatePagination,
  UniversityTemplate,
  UniversityTemplateListResponse,
  UpdateTemplateRequest,
  UpdateTemplateResponse,
} from '../models/university-template.model';

@Injectable({ providedIn: 'root' })
export class UniversityTemplatesService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(UniversityAuthService);
  private readonly baseUrl = environment.universityApiBaseUrl;

  readonly templates = signal<UniversityTemplate[]>([]);
  readonly currentTemplate = signal<UniversityTemplate | null>(null);
  readonly pagination = signal<TemplatePagination | null>(null);

  readonly loading = signal<boolean>(false);
  readonly singleLoading = signal<boolean>(false);
  readonly creating = signal<boolean>(false);
  readonly updating = signal<boolean>(false);
  readonly deleting = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // API #8: GET /organization/templates (List All Templates)
  getTemplates(
    page = 1,
    limit = 20
  ): Observable<UniversityTemplateListResponse> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });

    const url = `${this.baseUrl}${UNIVERSITY_TEMPLATES_API.LIST}`;

    return this.http
      .get<UniversityTemplateListResponse>(url, { headers, params })
      .pipe(
        tap((res) => {
          if (res?.success && res.data) {
            if (Array.isArray(res.data)) {
              this.templates.set(res.data);
              this.pagination.set(null);
            } else if (Array.isArray(res.data.items)) {
              this.templates.set(res.data.items);
              this.pagination.set(res.data.pagination || null);
            } else {
              this.templates.set([]);
              this.pagination.set(null);
            }
          }
          this.loading.set(false);
        }),
        catchError((err: HttpErrorResponse) => {
          const errorMsg = this.extractErrorMessage(err, 'list');
          this.error.set(errorMsg);
          this.loading.set(false);
          return throwError(() => err);
        })
      );
  }

  // API #9: GET /organization/templates/:templateId (Get Single Template)
  getTemplate(templateId: string): Observable<SingleTemplateResponse> {
    this.singleLoading.set(true);
    this.error.set(null);

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });

    const url = `${this.baseUrl}${UNIVERSITY_TEMPLATES_API.DETAIL}/${encodeURIComponent(templateId)}`;

    return this.http.get<SingleTemplateResponse>(url, { headers }).pipe(
      tap((res) => {
        if (res?.success && res.data) {
          this.currentTemplate.set(res.data);
        }
        this.singleLoading.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        const errorMsg = this.extractErrorMessage(err, 'get');
        this.error.set(errorMsg);
        this.singleLoading.set(false);
        return throwError(() => err);
      })
    );
  }

  // API #10: POST /organization/templates (Create Template)
  createTemplate(
    payload: CreateTemplateRequest
  ): Observable<CreateTemplateResponse> {
    this.creating.set(true);
    this.error.set(null);

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    });

    const url = `${this.baseUrl}${UNIVERSITY_TEMPLATES_API.CREATE}`;

    return this.http
      .post<CreateTemplateResponse>(url, payload, { headers })
      .pipe(
        tap((res) => {
          if (res?.success && res.data) {
            const current = this.templates();
            this.templates.set([res.data, ...current]);
          }
          this.creating.set(false);
        }),
        catchError((err: HttpErrorResponse) => {
          const errorMsg = this.extractErrorMessage(err, 'create');
          this.error.set(errorMsg);
          this.creating.set(false);
          return throwError(() => err);
        })
      );
  }

  // API #11: PUT /organization/templates/:templateId (Update Template)
  updateTemplate(
    templateId: string,
    payload: UpdateTemplateRequest
  ): Observable<UpdateTemplateResponse> {
    this.updating.set(true);
    this.error.set(null);

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    });

    const url = `${this.baseUrl}${UNIVERSITY_TEMPLATES_API.UPDATE}/${encodeURIComponent(templateId)}`;

    return this.http
      .put<UpdateTemplateResponse>(url, payload, { headers })
      .pipe(
        tap((res) => {
          if (res?.success && res.data) {
            const updated = this.templates().map((item) =>
              item._id === templateId ? { ...item, ...res.data } : item
            );
            this.templates.set(updated);
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

  // API #12: DELETE /organization/templates/:templateId (Soft Delete Template)
  deleteTemplate(templateId: string): Observable<DeleteTemplateResponse> {
    this.deleting.set(true);
    this.error.set(null);

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });

    const url = `${this.baseUrl}${UNIVERSITY_TEMPLATES_API.DELETE}/${encodeURIComponent(templateId)}`;

    return this.http.delete<DeleteTemplateResponse>(url, { headers }).pipe(
      tap((res) => {
        if (res?.success) {
          const remaining = this.templates().filter(
            (item) => item._id !== templateId
          );
          this.templates.set(remaining);

          const pag = this.pagination();
          if (pag && pag.total > 0) {
            this.pagination.set({
              ...pag,
              total: pag.total - 1,
            });
          }
        }
        this.deleting.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        const errorMsg = this.extractErrorMessage(err, 'delete');
        this.error.set(errorMsg);
        this.deleting.set(false);
        return throwError(() => err);
      })
    );
  }

  private extractErrorMessage(
    err: HttpErrorResponse,
    action: 'list' | 'get' | 'create' | 'update' | 'delete' = 'list'
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
        return 'Bad request. Please verify template fields.';
      case 401:
        return 'Session expired or unauthorized. Please sign in again.';
      case 403:
        return 'Access denied. You do not have permission to manage organization templates.';
      case 404:
        return action === 'delete'
          ? 'Template not found or already deleted.'
          : action === 'get'
            ? 'Template details not found.'
            : action === 'update'
              ? 'Template not found or has already been removed.'
              : 'The requested templates resource was not found.';
      case 409:
        return 'Conflict: A template with this name already exists.';
      case 500:
        return 'Internal server error while processing template request. Please try again.';
      default:
        return (
          err.message ||
          'An unexpected error occurred while communicating with templates backend.'
        );
    }
  }
}
