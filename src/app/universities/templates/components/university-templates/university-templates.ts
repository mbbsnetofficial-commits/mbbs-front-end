import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../../shared/ui/icon/icon';
import { UniversityHeaderComponent } from '../../../shared/components/university-header/university-header';
import { UniversityTemplate } from '../../models/university-template.model';
import { UniversityTemplatesService } from '../../services/university-templates.service';

@Component({
  selector: 'app-university-templates',
  standalone: true,
  imports: [CommonModule, FormsModule, Icon, UniversityHeaderComponent],
  templateUrl: './university-templates.html',
  styleUrl: './university-templates.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UniversityTemplatesComponent implements OnInit {
  private readonly templatesService = inject(UniversityTemplatesService);

  readonly templates = this.templatesService.templates;
  readonly pagination = this.templatesService.pagination;
  readonly currentTemplate = this.templatesService.currentTemplate;

  readonly loading = this.templatesService.loading;
  readonly singleLoading = this.templatesService.singleLoading;
  readonly creating = this.templatesService.creating;
  readonly updating = this.templatesService.updating;
  readonly deleting = this.templatesService.deleting;
  readonly error = this.templatesService.error;

  readonly currentPage = signal<number>(1);

  // Create / Edit Modal State (APIs #10 and #11)
  readonly isModalOpen = signal<boolean>(false);
  readonly modalMode = signal<'create' | 'edit'>('create');
  readonly editingTemplateId = signal<string | null>(null);

  formName = '';
  formSubject = '';
  formMessage = '';
  readonly modalErrorMessage = signal<string | null>(null);

  // View / Single Template Modal State (API #9)
  readonly isViewModalOpen = signal<boolean>(false);
  readonly viewTemplate = signal<UniversityTemplate | null>(null);

  // Delete Template Modal State (API #12)
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly templateToDelete = signal<UniversityTemplate | null>(null);
  readonly deleteErrorMessage = signal<string | null>(null);

  // Toast Notification State
  readonly toastSuccessMessage = signal<string | null>(null);

  get isSubmitting(): boolean {
    return this.creating() || this.updating();
  }

  ngOnInit(): void {
    this.loadTemplates(1);
  }

  loadTemplates(page = 1): void {
    this.currentPage.set(page);
    this.templatesService.getTemplates(page, 20).subscribe({
      error: () => {
        // Error state handled by signal
      },
    });
  }

  goToPage(page: number): void {
    const pag = this.pagination();
    if (!pag || page < 1 || page > pag.totalPages || this.loading()) return;
    this.loadTemplates(page);
  }

  retry(): void {
    this.loadTemplates(this.currentPage());
  }

  // --- API #9: View Single Template ---
  openViewModal(template: UniversityTemplate): void {
    this.viewTemplate.set(template);
    this.isViewModalOpen.set(true);

    // Fetch freshest data from API #9
    this.templatesService.getTemplate(template._id).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.viewTemplate.set(res.data);
        }
      },
    });
  }

  closeViewModal(): void {
    this.isViewModalOpen.set(false);
    this.viewTemplate.set(null);
  }

  // --- API #10: Create Modal ---
  openCreateModal(): void {
    this.modalMode.set('create');
    this.editingTemplateId.set(null);
    this.formName = '';
    this.formSubject = '';
    this.formMessage = '';
    this.modalErrorMessage.set(null);
    this.isModalOpen.set(true);
  }

  // --- API #11: Edit Modal ---
  openEditModal(template: UniversityTemplate): void {
    this.modalMode.set('edit');
    this.editingTemplateId.set(template._id);
    this.formName = template.name || '';
    this.formSubject = template.subject || '';
    this.formMessage = template.message || '';
    this.modalErrorMessage.set(null);
    this.isModalOpen.set(true);

    // Optionally load latest version from API #9
    this.templatesService.getTemplate(template._id).subscribe({
      next: (res) => {
        if (res?.success && res.data && this.editingTemplateId() === template._id) {
          this.formName = res.data.name || this.formName;
          this.formSubject = res.data.subject || this.formSubject;
          this.formMessage = res.data.message || this.formMessage;
        }
      },
    });
  }

  closeModal(): void {
    if (this.isSubmitting) return;
    this.isModalOpen.set(false);
    this.modalErrorMessage.set(null);
  }

  insertPlaceholder(placeholder: string): void {
    if (!this.formMessage) {
      this.formMessage = placeholder;
    } else {
      this.formMessage += ' ' + placeholder;
    }
  }

  submitForm(): void {
    const trimmedName = this.formName.trim();
    const trimmedSubject = this.formSubject.trim();
    const trimmedMessage = this.formMessage.trim();

    if (!trimmedName || !trimmedSubject || !trimmedMessage || this.isSubmitting) {
      return;
    }

    this.modalErrorMessage.set(null);

    if (this.modalMode() === 'create') {
      this.templatesService
        .createTemplate({
          name: trimmedName,
          subject: trimmedSubject,
          message: trimmedMessage,
        })
        .subscribe({
          next: (res) => {
            if (res?.success) {
              this.isModalOpen.set(false);
              this.showToast('Template created successfully.');
            }
          },
          error: (err) => {
            const msg =
              err?.error?.message ||
              err?.error?.error ||
              err?.message ||
              'Failed to create template. Please try again.';
            this.modalErrorMessage.set(msg);
          },
        });
    } else {
      const templateId = this.editingTemplateId();
      if (!templateId) return;

      this.templatesService
        .updateTemplate(templateId, {
          name: trimmedName,
          subject: trimmedSubject,
          message: trimmedMessage,
        })
        .subscribe({
          next: (res) => {
            if (res?.success) {
              this.isModalOpen.set(false);
              this.showToast('Template updated successfully.');
            }
          },
          error: (err) => {
            const msg =
              err?.error?.message ||
              err?.error?.error ||
              err?.message ||
              'Failed to update template. Please try again.';
            this.modalErrorMessage.set(msg);
          },
        });
    }
  }

  // --- API #12: Delete Template Modal ---
  openDeleteModal(template: UniversityTemplate): void {
    this.templateToDelete.set(template);
    this.deleteErrorMessage.set(null);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    if (this.deleting()) return;
    this.isDeleteModalOpen.set(false);
    this.templateToDelete.set(null);
    this.deleteErrorMessage.set(null);
  }

  confirmDelete(): void {
    const tmpl = this.templateToDelete();
    if (!tmpl || this.deleting()) return;

    this.deleteErrorMessage.set(null);

    this.templatesService.deleteTemplate(tmpl._id).subscribe({
      next: (res) => {
        if (res?.success) {
          this.isDeleteModalOpen.set(false);
          this.templateToDelete.set(null);
          this.showToast('Template deleted successfully.');
        }
      },
      error: (err) => {
        const msg =
          err?.error?.message ||
          err?.error?.error ||
          err?.message ||
          'Failed to delete template. Please try again.';
        this.deleteErrorMessage.set(msg);
      },
    });
  }

  private showToast(msg: string): void {
    this.toastSuccessMessage.set(msg);
    setTimeout(() => {
      this.toastSuccessMessage.set(null);
    }, 4000);
  }
}
