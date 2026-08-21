import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import {
  TemplatePagination,
  UniversityTemplate,
} from '../../models/university-template.model';
import { UniversityTemplatesService } from '../../services/university-templates.service';
import { UniversityTemplatesComponent } from './university-templates';

describe('UniversityTemplatesComponent', () => {
  let component: UniversityTemplatesComponent;
  let fixture: ComponentFixture<UniversityTemplatesComponent>;
  let templatesServiceMock: {
    templates: ReturnType<typeof signal<UniversityTemplate[]>>;
    pagination: ReturnType<typeof signal<TemplatePagination | null>>;
    currentTemplate: ReturnType<typeof signal<UniversityTemplate | null>>;
    loading: ReturnType<typeof signal<boolean>>;
    singleLoading: ReturnType<typeof signal<boolean>>;
    creating: ReturnType<typeof signal<boolean>>;
    updating: ReturnType<typeof signal<boolean>>;
    deleting: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    getTemplates: ReturnType<typeof vi.fn>;
    getTemplate: ReturnType<typeof vi.fn>;
    createTemplate: ReturnType<typeof vi.fn>;
    updateTemplate: ReturnType<typeof vi.fn>;
    deleteTemplate: ReturnType<typeof vi.fn>;
  };

  const mockTemplate: UniversityTemplate = {
    _id: '67b370004e9b8a0012345678',
    organizationId: 'ORG_TSMU_001',
    name: 'Scholarship MBBS Invitation',
    subject: 'Merit Scholarship Offer for MBBS 2026 - TSMU',
    message:
      'Congratulations! You qualify for a 20% tuition scholarship at Tbilisi State Medical University.',
    isDeleted: false,
    createdAt: '2026-08-20T10:00:00.000Z',
  };

  const mockPagination: TemplatePagination = {
    page: 1,
    limit: 20,
    total: 25,
    totalPages: 2,
  };

  beforeEach(async () => {
    templatesServiceMock = {
      templates: signal<UniversityTemplate[]>([mockTemplate]),
      pagination: signal<TemplatePagination | null>(mockPagination),
      currentTemplate: signal<UniversityTemplate | null>(mockTemplate),
      loading: signal(false),
      singleLoading: signal(false),
      creating: signal(false),
      updating: signal(false),
      deleting: signal(false),
      error: signal<string | null>(null),
      getTemplates: vi.fn().mockReturnValue(
        of({
          success: true,
          data: {
            items: [mockTemplate],
            pagination: mockPagination,
          },
        })
      ),
      getTemplate: vi.fn().mockReturnValue(
        of({
          success: true,
          data: mockTemplate,
        })
      ),
      createTemplate: vi.fn().mockReturnValue(
        of({
          success: true,
          message: 'Template created successfully',
          data: {
            ...mockTemplate,
            _id: '67b370004e9b8a0012345999',
            name: 'New General Offer',
          },
        })
      ),
      updateTemplate: vi.fn().mockReturnValue(
        of({
          success: true,
          message: 'Template updated successfully',
          data: {
            ...mockTemplate,
            name: 'Updated Scholarship MBBS Invitation',
          },
        })
      ),
      deleteTemplate: vi.fn().mockReturnValue(
        of({
          success: true,
          message: 'Template deleted successfully',
          data: {
            deleted: true,
            templateId: '67b370004e9b8a0012345678',
          },
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [UniversityTemplatesComponent],
      providers: [
        provideRouter([]),
        { provide: UniversityTemplatesService, useValue: templatesServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UniversityTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }, 30000);

  it('should create UniversityTemplatesComponent and load templates on init with page 1', () => {
    expect(component).toBeTruthy();
    expect(templatesServiceMock.getTemplates).toHaveBeenCalledWith(1, 20);
  });

  it('should render real template cards with name, subject, and message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.template-card');
    expect(cards.length).toBe(1);

    const firstCard = cards[0];
    expect(firstCard.textContent).toContain('Scholarship MBBS Invitation');
    expect(firstCard.textContent).toContain(
      'Merit Scholarship Offer for MBBS 2026 - TSMU'
    );
    expect(firstCard.textContent).toContain(
      'Congratulations! You qualify for a 20% tuition scholarship'
    );
  });

  describe('API #8: Pagination Controls', () => {
    it('should render backend pagination bar and call getTemplates on page change', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const paginationNav = compiled.querySelector('.pagination-nav');
      expect(paginationNav).toBeTruthy();
      expect(paginationNav?.textContent).toContain('Page 1 of 2');

      component.goToPage(2);

      expect(templatesServiceMock.getTemplates).toHaveBeenCalledWith(2, 20);
      expect(component.currentPage()).toBe(2);
    });

    it('should ignore invalid page numbers', () => {
      component.goToPage(0);
      expect(templatesServiceMock.getTemplates).toHaveBeenCalledTimes(1);

      component.goToPage(5);
      expect(templatesServiceMock.getTemplates).toHaveBeenCalledTimes(1);
    });
  });

  describe('API #9: View Single Template Flow', () => {
    it('should open View modal and fetch latest single template data via getTemplate', () => {
      component.openViewModal(mockTemplate);
      fixture.detectChanges();

      expect(component.isViewModalOpen()).toBe(true);
      expect(templatesServiceMock.getTemplate).toHaveBeenCalledWith(
        mockTemplate._id
      );

      const compiled = fixture.nativeElement as HTMLElement;
      const viewModal = compiled.querySelector('.view-modal');
      expect(viewModal).toBeTruthy();
      expect(viewModal?.textContent).toContain('Scholarship MBBS Invitation');
      expect(viewModal?.textContent).toContain('ID: 67b370004e9b8a0012345678');
    });

    it('should close View modal when clicking Close button', () => {
      component.openViewModal(mockTemplate);
      fixture.detectChanges();

      component.closeViewModal();
      fixture.detectChanges();

      expect(component.isViewModalOpen()).toBe(false);
      expect(component.viewTemplate()).toBeNull();
    });
  });

  describe('API #10: Create Template Flow', () => {
    it('should open Create modal with clean empty form fields', () => {
      component.openCreateModal();
      fixture.detectChanges();

      expect(component.isModalOpen()).toBe(true);
      expect(component.modalMode()).toBe('create');
      expect(component.formName).toBe('');
      expect(component.formSubject).toBe('');
      expect(component.formMessage).toBe('');

      const compiled = fixture.nativeElement as HTMLElement;
      const modalTitle = compiled.querySelector('#template-modal-title');
      expect(modalTitle?.textContent).toContain('Create Admission Template');
    });

    it('should call createTemplate with entered values and close modal on success', () => {
      component.openCreateModal();
      fixture.detectChanges();

      component.formName = 'Scholarship MBBS Invitation';
      component.formSubject = 'Merit Scholarship Offer for MBBS 2026 - TSMU';
      component.formMessage =
        'Congratulations! You qualify for a 20% tuition scholarship.';

      component.submitForm();

      expect(templatesServiceMock.createTemplate).toHaveBeenCalledWith({
        name: 'Scholarship MBBS Invitation',
        subject: 'Merit Scholarship Offer for MBBS 2026 - TSMU',
        message: 'Congratulations! You qualify for a 20% tuition scholarship.',
      });

      expect(component.isModalOpen()).toBe(false);
      expect(component.toastSuccessMessage()).toContain('created successfully');
    });

    it('should display error inside modal and keep modal open if createTemplate fails', () => {
      templatesServiceMock.createTemplate.mockReturnValue(
        throwError(() => ({
          error: { message: 'Conflict: Template name already exists.' },
          status: 409,
        }))
      );

      component.openCreateModal();
      component.formName = 'Duplicate Name';
      component.formSubject = 'Subject';
      component.formMessage = 'Body text';

      component.submitForm();

      expect(templatesServiceMock.createTemplate).toHaveBeenCalled();
      expect(component.isModalOpen()).toBe(true);
      expect(component.modalErrorMessage()).toBe(
        'Conflict: Template name already exists.'
      );
    });

    it('should prevent submission if fields are empty or only whitespace', () => {
      component.openCreateModal();
      component.formName = '   ';
      component.formSubject = '';
      component.formMessage = '   ';

      component.submitForm();

      expect(templatesServiceMock.createTemplate).not.toHaveBeenCalled();
      expect(component.isModalOpen()).toBe(true);
    });
  });

  describe('API #11: Update Template Flow', () => {
    it('should open Edit modal pre-populated with existing template data', () => {
      component.openEditModal(mockTemplate);
      fixture.detectChanges();

      expect(component.isModalOpen()).toBe(true);
      expect(component.modalMode()).toBe('edit');
      expect(component.editingTemplateId()).toBe('67b370004e9b8a0012345678');
      expect(component.formName).toBe('Scholarship MBBS Invitation');
      expect(component.formSubject).toBe(
        'Merit Scholarship Offer for MBBS 2026 - TSMU'
      );

      const compiled = fixture.nativeElement as HTMLElement;
      const modalTitle = compiled.querySelector('#template-modal-title');
      expect(modalTitle?.textContent).toContain('Edit Admission Template');
    });

    it('should call updateTemplate with dynamic templateId and updated fields on save', () => {
      component.openEditModal(mockTemplate);
      fixture.detectChanges();

      component.formName = 'Updated Scholarship MBBS Invitation';
      component.formSubject = 'Merit Scholarship 2026 (Updated) - TSMU';
      component.formMessage = 'Updated message body.';

      component.submitForm();

      expect(templatesServiceMock.updateTemplate).toHaveBeenCalledWith(
        '67b370004e9b8a0012345678',
        {
          name: 'Updated Scholarship MBBS Invitation',
          subject: 'Merit Scholarship 2026 (Updated) - TSMU',
          message: 'Updated message body.',
        }
      );

      expect(component.isModalOpen()).toBe(false);
      expect(component.toastSuccessMessage()).toContain('updated successfully');
    });

    it('should display error inside modal and keep modal open if updateTemplate fails', () => {
      templatesServiceMock.updateTemplate.mockReturnValue(
        throwError(() => ({
          error: { message: 'Template not found or has been removed.' },
          status: 404,
        }))
      );

      component.openEditModal(mockTemplate);
      component.submitForm();

      expect(templatesServiceMock.updateTemplate).toHaveBeenCalled();
      expect(component.isModalOpen()).toBe(true);
      expect(component.modalErrorMessage()).toBe(
        'Template not found or has been removed.'
      );
    });
  });

  describe('API #12: Delete Template Flow', () => {
    it('should open Delete confirmation modal with template details', () => {
      component.openDeleteModal(mockTemplate);
      fixture.detectChanges();

      expect(component.isDeleteModalOpen()).toBe(true);
      expect(component.templateToDelete()).toEqual(mockTemplate);

      const compiled = fixture.nativeElement as HTMLElement;
      const modal = compiled.querySelector('.delete-modal');
      expect(modal).toBeTruthy();
      expect(modal?.textContent).toContain('Delete this template?');
      expect(modal?.textContent).toContain('Scholarship MBBS Invitation');
    });

    it('should call deleteTemplate with dynamic templateId and close modal on confirm', () => {
      component.openDeleteModal(mockTemplate);
      fixture.detectChanges();

      component.confirmDelete();

      expect(templatesServiceMock.deleteTemplate).toHaveBeenCalledWith(
        mockTemplate._id
      );
      expect(component.isDeleteModalOpen()).toBe(false);
      expect(component.templateToDelete()).toBeNull();
      expect(component.toastSuccessMessage()).toContain('deleted successfully');
    });

    it('should display error inside modal and keep modal open if deleteTemplate fails', () => {
      templatesServiceMock.deleteTemplate.mockReturnValue(
        throwError(() => ({
          error: { message: 'Failed to delete template.' },
          status: 500,
        }))
      );

      component.openDeleteModal(mockTemplate);
      component.confirmDelete();

      expect(templatesServiceMock.deleteTemplate).toHaveBeenCalled();
      expect(component.isDeleteModalOpen()).toBe(true);
      expect(component.deleteErrorMessage()).toBe('Failed to delete template.');
    });

    it('should close delete modal on cancel without calling API', () => {
      component.openDeleteModal(mockTemplate);
      fixture.detectChanges();

      component.closeDeleteModal();
      fixture.detectChanges();

      expect(component.isDeleteModalOpen()).toBe(false);
      expect(templatesServiceMock.deleteTemplate).not.toHaveBeenCalled();
    });
  });

  describe('UI States', () => {
    it('should render clean empty state when no templates exist', () => {
      templatesServiceMock.templates.set([]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const emptyState = compiled.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState?.textContent).toContain('No Templates Found');
    });

    it('should render error alert and retry on button click', () => {
      templatesServiceMock.templates.set([]);
      templatesServiceMock.error.set('Failed to load templates.');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const errorAlert = compiled.querySelector('.alert-card.error');
      expect(errorAlert).toBeTruthy();
      expect(errorAlert?.textContent).toContain('Failed to Load Templates');

      const retryBtn = compiled.querySelector('.btn-retry') as HTMLButtonElement;
      expect(retryBtn).toBeTruthy();

      retryBtn.click();
      expect(templatesServiceMock.getTemplates).toHaveBeenCalledTimes(2);
    });
  });
});
