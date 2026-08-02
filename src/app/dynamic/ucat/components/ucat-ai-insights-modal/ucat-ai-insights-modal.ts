import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { UcatInsightsData } from '../../models/ucat-insights.model';
import { UcatInsightsService } from '../../services/ucat-insights.service';

@Component({
  selector: 'app-ucat-ai-insights-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ucat-ai-insights-modal.html',
  styleUrl: './ucat-ai-insights-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UcatAiInsightsModal implements OnInit {
  @Input({ required: true }) testSessionId!: string;
  @Input() testTitle = 'UCAT Test Performance';

  @Output() closeModal = new EventEmitter<void>();
  @Output() continueToAiChat = new EventEmitter<string>();

  readonly insightsData = signal<UcatInsightsData | null>(null);
  readonly isGenerating = signal<boolean>(false);
  readonly isFetching = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  constructor(private readonly ucatInsightsService: UcatInsightsService) {}

  ngOnInit(): void {
    if (this.testSessionId) {
      this.initInsightsWorkflow();
    }
  }

  initInsightsWorkflow(): void {
    this.errorMessage.set(null);
    this.isFetching.set(true);

    // Try fetching existing stored insights first
    this.ucatInsightsService.getStoredInsights(this.testSessionId).subscribe({
      next: (res) => {
        this.isFetching.set(false);
        if (res && res.data && res.data.insightsSummary) {
          this.insightsData.set(res.data);
        } else {
          // If not stored yet, generate first then fetch stored
          this.generateAndFetch();
        }
      },
      error: () => {
        // If fetch failed/404, trigger generation first
        this.generateAndFetch();
      }
    });
  }

  private generateAndFetch(): void {
    this.isGenerating.set(true);
    this.isFetching.set(false);
    this.errorMessage.set(null);

    // Step 1: POST /api/v1/ucat/insights/generate
    this.ucatInsightsService.generateInsights(this.testSessionId).subscribe({
      next: () => {
        this.isGenerating.set(false);
        this.isFetching.set(true);

        // Step 2: GET /api/v1/ucat/insights/test-zone-insights/{testSessionId}
        this.ucatInsightsService.getStoredInsights(this.testSessionId).subscribe({
          next: (res) => {
            this.isFetching.set(false);
            if (res && res.data) {
              this.insightsData.set(res.data);
            } else {
              this.errorMessage.set('Insights were generated but could not be loaded.');
            }
          },
          error: (err) => {
            this.isFetching.set(false);
            const msg = err?.error?.message || err?.message || 'Failed to fetch stored insights.';
            this.errorMessage.set(msg);
          }
        });
      },
      error: (err) => {
        this.isGenerating.set(false);
        const msg = err?.error?.message || err?.message || 'Failed to generate AI performance insights.';
        this.errorMessage.set(msg);
      }
    });
  }

  onRetry(): void {
    this.initInsightsWorkflow();
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onOpenAiChat(): void {
    this.closeModal.emit();
    this.continueToAiChat.emit(this.testSessionId);
  }
}
