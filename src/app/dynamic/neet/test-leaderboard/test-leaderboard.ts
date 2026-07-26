import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { TestLeaderboardEntry } from '../../../core/models/test-leaderboard.model';
import { TestLeaderboardService } from '../../../core/serivce/test-leaderboard.service';

@Component({
  selector: 'app-test-leaderboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './test-leaderboard.html',
  styleUrl: './test-leaderboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TestLeaderboard implements OnInit {
  readonly entries = signal<TestLeaderboardEntry[]>([]);
  readonly myRank = signal<TestLeaderboardEntry | null>(null);
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly total = signal(0);
  readonly totalPages = signal(1);
  readonly period = signal('ALL');
  readonly testType = signal('Previous Year');
  readonly paperId = signal(15);
  readonly isLoadingBoard = signal(false);
  readonly isLoadingMyRank = signal(false);
  readonly boardError = signal<string | null>(null);
  readonly myRankError = signal<string | null>(null);

  readonly pageStart = computed(() =>
    this.total() === 0 ? 0 : (this.page() - 1) * this.limit() + 1
  );

  readonly pageEnd = computed(() =>
    Math.min(this.page() * this.limit(), this.total())
  );

  constructor(
    private readonly leaderboardService: TestLeaderboardService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.testType.set(params.get('test_type')?.trim() || 'Previous Year');
    this.period.set(params.get('period')?.trim() || 'ALL');
    this.paperId.set(this.positiveNumber(params.get('previous_year_paper_id'), 15));
    this.page.set(this.positiveNumber(params.get('page'), 1));
    this.loadMyRank();
    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.isLoadingBoard.set(true);
    this.boardError.set(null);

    this.leaderboardService.getLeaderboard({
      testType: this.testType(),
      previousYearPaperId: this.paperId(),
      period: this.period(),
      page: this.page(),
      limit: this.limit()
    }).subscribe({
      next: (response) => {
        this.entries.set(response.data ?? []);
        this.page.set(response.page || 1);
        this.limit.set(response.limit || 20);
        this.total.set(response.total ?? 0);
        this.totalPages.set(Math.max(1, response.totalPages || 1));
        this.period.set(response.period || this.period());
        this.isLoadingBoard.set(false);
      },
      error: (error) => {
        this.boardError.set(
          this.getErrorMessage(error, 'Unable to load the leaderboard.')
        );
        this.isLoadingBoard.set(false);
      }
    });
  }

  loadMyRank(): void {
    this.isLoadingMyRank.set(true);
    this.myRankError.set(null);

    this.leaderboardService.getMyRank(this.period()).subscribe({
      next: (response) => {
        this.myRank.set(response.data ?? null);
        this.isLoadingMyRank.set(false);
      },
      error: (error) => {
        this.myRankError.set(
          this.getErrorMessage(error, 'Unable to load your rank.')
        );
        this.isLoadingMyRank.set(false);
      }
    });
  }

  previousPage(): void {
    if (this.page() <= 1 || this.isLoadingBoard()) {
      return;
    }
    this.page.update((page) => page - 1);
    this.loadLeaderboard();
  }

  nextPage(): void {
    if (this.page() >= this.totalPages() || this.isLoadingBoard()) {
      return;
    }
    this.page.update((page) => page + 1);
    this.loadLeaderboard();
  }

  isCurrentStudent(entry: TestLeaderboardEntry): boolean {
    return this.myRank()?.student_id === entry.student_id;
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '?';
    }
    return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
  }

  rankLabel(rank: number): string {
    if (rank === 1) {
      return '🥇';
    }
    if (rank === 2) {
      return '🥈';
    }
    if (rank === 3) {
      return '🥉';
    }
    return `#${rank}`;
  }

  formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }

  private positiveNumber(value: string | null, fallback: number): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  private getErrorMessage(error: any, fallback: string): string {
    return error?.error?.message ?? error?.message ?? fallback;
  }
}
