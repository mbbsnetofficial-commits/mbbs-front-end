import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { UniversityAuthService } from '../../auth/services/university-auth.service';
import {
  CreateTemplateRequest,
  CreateTemplateResponse,
  DeleteTemplateResponse,
  SingleTemplateResponse,
  UniversityTemplate,
  UniversityTemplateListResponse,
  UpdateTemplateRequest,
  UpdateTemplateResponse,
} from '../models/university-template.model';
import { UniversityTemplatesService } from './university-templates.service';

describe('UniversityTemplatesService', () => {
  let service: UniversityTemplatesService;
  let httpTestingController: HttpTestingController;
  let authServiceMock: { getToken: ReturnType<typeof vi.fn> };

  const baseUrl = environment.universityApiBaseUrl;
  const templatesUrl = `${baseUrl}/organization/templates`;
  const templateId = '67b370004e9b8a0012345678';
  const singleUrl = `${templatesUrl}/${templateId}`;
  const deleteUrl = `${templatesUrl}/${templateId}`;

  const mockTemplate: UniversityTemplate = {
    _id: templateId,
    organizationId: 'ORG_TSMU_001',
    name: 'Scholarship MBBS Invitation',
    subject: 'Merit Scholarship Offer for MBBS 2026 - TSMU',
    message:
      'Congratulations! You qualify for a 20% tuition scholarship at Tbilisi State Medical University.',
    isDeleted: false,
    createdAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z',
  };

  const mockCreateRequest: CreateTemplateRequest = {
    name: 'Scholarship MBBS Invitation',
    subject: 'Merit Scholarship Offer for MBBS 2026 - TSMU',
    message:
      'Congratulations! You qualify for a 20% tuition scholarship at Tbilisi State Medical University.',
  };

  const mockCreateResponse: CreateTemplateResponse = {
    success: true,
    message: 'Template created successfully',
    data: mockTemplate,
  };

  const mockUpdateRequest: UpdateTemplateRequest = {
    name: 'Updated Scholarship MBBS Invitation',
    subject: 'Merit Scholarship 2026 (Updated) - TSMU',
    message: 'Updated scholarship details and terms.',
  };

  const mockUpdateResponse: UpdateTemplateResponse = {
    success: true,
    message: 'Template updated successfully',
    data: {
      ...mockTemplate,
      name: 'Updated Scholarship MBBS Invitation',
      subject: 'Merit Scholarship 2026 (Updated) - TSMU',
      message: 'Updated scholarship details and terms.',
      updatedAt: '2026-08-21T09:00:00.000Z',
    },
  };

  const mockListResponse: UniversityTemplateListResponse = {
    success: true,
    message: 'Templates retrieved successfully',
    data: {
      items: [mockTemplate],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    },
  };

  const mockSingleResponse: SingleTemplateResponse = {
    success: true,
    message: 'Template details retrieved successfully',
    data: mockTemplate,
  };

  const mockDeleteResponse: DeleteTemplateResponse = {
    success: true,
    message: 'Template deleted successfully',
    data: {
      deleted: true,
      templateId,
    },
  };

  beforeEach(() => {
    authServiceMock = {
      getToken: vi.fn().mockReturnValue('mock-university-token'),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UniversityTemplatesService,
        { provide: UniversityAuthService, useValue: authServiceMock },
      ],
    });

    service = TestBed.inject(UniversityTemplatesService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create UniversityTemplatesService with initial signals state', () => {
    expect(service).toBeTruthy();
    expect(service.loading()).toBe(false);
    expect(service.singleLoading()).toBe(false);
    expect(service.creating()).toBe(false);
    expect(service.updating()).toBe(false);
    expect(service.deleting()).toBe(false);
    expect(service.error()).toBeNull();
    expect(service.templates()).toEqual([]);
  });

  describe('API #8: getTemplates(page, limit)', () => {
    it('1. should call GET /organization/templates with page and limit query params and Bearer token', () => {
      service.getTemplates(2, 10).subscribe();

      const req = httpTestingController.expectOne(
        (r) =>
          r.url === templatesUrl &&
          r.params.get('page') === '2' &&
          r.params.get('limit') === '10'
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-university-token'
      );

      req.flush(mockListResponse);
    });

    it('2. should map paginated response items and pagination metadata to signals', () => {
      service.getTemplates().subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpTestingController.expectOne(
        (r) => r.url === templatesUrl
      );
      req.flush(mockListResponse);

      expect(service.templates().length).toBe(1);
      expect(service.pagination()?.totalPages).toBe(1);
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('3. should support direct array response format gracefully', () => {
      service.getTemplates().subscribe();

      const req = httpTestingController.expectOne((r) => r.url === templatesUrl);
      req.flush({ success: true, data: [mockTemplate] });

      expect(service.templates().length).toBe(1);
      expect(service.pagination()).toBeNull();
    });

    it('4. should handle 400 Bad Request error on getTemplates', () => {
      service.getTemplates().subscribe({ error: () => {} });

      const req = httpTestingController.expectOne((r) => r.url === templatesUrl);
      req.flush(null, { status: 400, statusText: 'Bad Request' });

      expect(service.error()).toBe('Bad request. Please verify template fields.');
      expect(service.loading()).toBe(false);
    });

    it('5. should handle 401 Unauthorized error on getTemplates', () => {
      service.getTemplates().subscribe({ error: () => {} });

      const req = httpTestingController.expectOne((r) => r.url === templatesUrl);
      req.flush({ message: 'Token expired.' }, {
        status: 401,
        statusText: 'Unauthorized',
      });

      expect(service.error()).toBe('Token expired.');
      expect(service.loading()).toBe(false);
    });

    it('6. should handle 500 Server Error on getTemplates', () => {
      service.getTemplates().subscribe({ error: () => {} });

      const req = httpTestingController.expectOne((r) => r.url === templatesUrl);
      req.flush(null, {
        status: 500,
        statusText: 'Internal Server Error',
      });

      expect(service.error()).toBe(
        'Internal server error while processing template request. Please try again.'
      );
      expect(service.loading()).toBe(false);
    });
  });

  describe('API #9: getTemplate(templateId)', () => {
    it('1. should call GET /organization/templates/:templateId with dynamic ID and Bearer token', () => {
      service.getTemplate(templateId).subscribe();

      const req = httpTestingController.expectOne(singleUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-university-token'
      );

      req.flush(mockSingleResponse);
    });

    it('2. should map single template response and update currentTemplate signal', () => {
      service.getTemplate(templateId).subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res.data.name).toBe('Scholarship MBBS Invitation');
      });

      const req = httpTestingController.expectOne(singleUrl);
      req.flush(mockSingleResponse);

      expect(service.currentTemplate()).toEqual(mockTemplate);
      expect(service.singleLoading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('3. should handle 404 Not Found on getTemplate', () => {
      service.getTemplate(templateId).subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(singleUrl);
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(service.error()).toBe('Template details not found.');
      expect(service.singleLoading()).toBe(false);
    });

    it('4. should handle 500 Server Error on getTemplate', () => {
      service.getTemplate(templateId).subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(singleUrl);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(service.error()).toBe(
        'Internal server error while processing template request. Please try again.'
      );
      expect(service.singleLoading()).toBe(false);
    });
  });

  describe('API #10: createTemplate(payload)', () => {
    it('1. should call POST /organization/templates with exact payload and Bearer token', () => {
      service.createTemplate(mockCreateRequest).subscribe();

      const req = httpTestingController.expectOne(templatesUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockCreateRequest);
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-university-token'
      );

      req.flush(mockCreateResponse, { status: 201, statusText: 'Created' });
    });

    it('2. should map created template and prepend to templates signal upon success', () => {
      service.createTemplate(mockCreateRequest).subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res.data._id).toBe(templateId);
      });

      const req = httpTestingController.expectOne(templatesUrl);
      req.flush(mockCreateResponse, { status: 201, statusText: 'Created' });

      expect(service.creating()).toBe(false);
      expect(service.templates().length).toBe(1);
    });
  });

  describe('API #11: updateTemplate(templateId, payload)', () => {
    it('1. should call PUT /organization/templates/:templateId with dynamic ID, payload, and Bearer token', () => {
      service.updateTemplate(templateId, mockUpdateRequest).subscribe();

      const req = httpTestingController.expectOne(singleUrl);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockUpdateRequest);
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-university-token'
      );

      req.flush(mockUpdateResponse);
    });

    it('2. should map updated template and update in templates signal upon success', () => {
      service.templates.set([mockTemplate]);

      service.updateTemplate(templateId, mockUpdateRequest).subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpTestingController.expectOne(singleUrl);
      req.flush(mockUpdateResponse);

      expect(service.templates()[0].name).toBe(
        'Updated Scholarship MBBS Invitation'
      );
    });
  });

  describe('API #12: deleteTemplate(templateId)', () => {
    it('1. should call DELETE /organization/templates/:templateId with dynamic ID, no body, and Bearer token', () => {
      service.deleteTemplate(templateId).subscribe();

      const req = httpTestingController.expectOne(deleteUrl);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toBeNull();
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-university-token'
      );

      req.flush(mockDeleteResponse);
    });

    it('2. should remove deleted template from templates signal upon success', () => {
      service.templates.set([mockTemplate]);
      service.pagination.set({ page: 1, limit: 20, total: 1, totalPages: 1 });

      service.deleteTemplate(templateId).subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res.data.deleted).toBe(true);
      });

      const req = httpTestingController.expectOne(deleteUrl);
      req.flush(mockDeleteResponse);

      expect(service.templates().length).toBe(0);
      expect(service.pagination()?.total).toBe(0);
      expect(service.deleting()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('3. should toggle deleting loading signal during deletion lifecycle', () => {
      expect(service.deleting()).toBe(false);

      service.deleteTemplate(templateId).subscribe();
      expect(service.deleting()).toBe(true);

      const req = httpTestingController.expectOne(deleteUrl);
      req.flush(mockDeleteResponse);

      expect(service.deleting()).toBe(false);
    });

    it('4. should handle 401 Unauthorized error on deleteTemplate', () => {
      service.deleteTemplate(templateId).subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(deleteUrl);
      req.flush({ message: 'Token missing.' }, {
        status: 401,
        statusText: 'Unauthorized',
      });

      expect(service.error()).toBe('Token missing.');
      expect(service.deleting()).toBe(false);
    });

    it('5. should handle 403 Forbidden error on deleteTemplate', () => {
      service.deleteTemplate(templateId).subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(deleteUrl);
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(service.error()).toBe(
        'Access denied. You do not have permission to manage organization templates.'
      );
      expect(service.deleting()).toBe(false);
    });

    it('6. should handle 404 Not Found on deleteTemplate', () => {
      service.deleteTemplate(templateId).subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(deleteUrl);
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(service.error()).toBe('Template not found or already deleted.');
      expect(service.deleting()).toBe(false);
    });

    it('7. should handle 500 Server Error on deleteTemplate', () => {
      service.deleteTemplate(templateId).subscribe({ error: () => {} });

      const req = httpTestingController.expectOne(deleteUrl);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(service.error()).toBe(
        'Internal server error while processing template request. Please try again.'
      );
      expect(service.deleting()).toBe(false);
    });
  });
});
