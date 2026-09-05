import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { Icon } from '../../../../shared/ui/icon/icon';
import { UniversityHeaderComponent } from '../../../shared/components/university-header/university-header';
import { UniversityAuthService } from '../../../auth/services/university-auth.service';
import {
  StudentDiscoveryFilters,
  StudentSortBy,
  StudentSortOrder,
} from '../../models/university-student.model';
import { UniversityStudentsService } from '../../services/university-students.service';

@Component({
  selector: 'app-university-students',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Icon, UniversityHeaderComponent],
  templateUrl: './university-students.html',
  styleUrl: './university-students.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UniversityStudentsComponent implements OnInit, OnDestroy {
  private readonly studentsService = inject(UniversityStudentsService);
  private readonly authService = inject(UniversityAuthService);
  private readonly router = inject(Router);

  readonly students = this.studentsService.students;
  readonly pagination = this.studentsService.pagination;
  readonly loading = this.studentsService.loading;
  readonly error = this.studentsService.error;
  readonly currentUser = this.authService.currentUser;

  // Filter state
  searchQuery = '';
  country = '';
  course = '';
  minNeetScore: number | null = null;
  minPcb: number | null = null;
  maxBudget: number | null = null;
  profileCompletion: number | null = null;

  sortBy = signal<StudentSortBy>('createdAt');
  sortOrder = signal<StudentSortOrder>('desc');
  currentPage = signal<number>(1);
  pageSize = signal<number>(20);

  private readonly searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  ngOnInit(): void {
    this.searchSub = this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage.set(1);
        this.fetchStudents();
      });

    this.fetchStudents();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onSearchInput(value: string): void {
    this.searchQuery = value;
    this.searchSubject.next(value);
  }

  onFilterSubmit(): void {
    this.currentPage.set(1);
    this.fetchStudents();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.country = '';
    this.course = '';
    this.minNeetScore = null;
    this.minPcb = null;
    this.maxBudget = null;
    this.profileCompletion = null;
    this.sortBy.set('createdAt');
    this.sortOrder.set('desc');
    this.currentPage.set(1);
    this.fetchStudents();
  }

  setSorting(column: StudentSortBy): void {
    if (this.sortBy() === column) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(column);
      this.sortOrder.set('desc');
    }
    this.currentPage.set(1);
    this.fetchStudents();
  }

  goToPage(page: number): void {
    const currentPagination = this.pagination();
    if (
      !currentPagination ||
      page < 1 ||
      page > currentPagination.totalPages ||
      page === this.currentPage()
    ) {
      return;
    }
    this.currentPage.set(page);
    this.fetchStudents();
  }

  retry(): void {
    this.fetchStudents();
  }

  private fetchStudents(): void {
    const filters: StudentDiscoveryFilters = {
      page: this.currentPage(),
      limit: this.pageSize(),
      search: this.searchQuery?.trim() || undefined,
      country: this.country?.trim() || undefined,
      course: this.course?.trim() || undefined,
      minNeetScore:
        this.minNeetScore !== null && !isNaN(this.minNeetScore)
          ? this.minNeetScore
          : undefined,
      minPcb:
        this.minPcb !== null && !isNaN(this.minPcb) ? this.minPcb : undefined,
      maxBudget:
        this.maxBudget !== null && !isNaN(this.maxBudget)
          ? this.maxBudget
          : undefined,
      profileCompletion:
        this.profileCompletion !== null && !isNaN(this.profileCompletion)
          ? this.profileCompletion
          : undefined,
      sortBy: this.sortBy(),
      sortOrder: this.sortOrder(),
    };

    this.studentsService.getStudents(filters).subscribe({
      error: () => {
        // Error state handled via signal
      },
    });
  }
}
