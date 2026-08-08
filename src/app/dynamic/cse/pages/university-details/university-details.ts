import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CseStore } from '../../state/cse.store';

@Component({
  selector: 'app-cse-university-details',
  standalone: true,
  imports: [],
  templateUrl: './university-details.html',
  styleUrl: './university-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UniversityDetails implements OnInit {
  readonly store = inject(CseStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.store.setStep(5);
    const uniId = this.route.snapshot.paramMap.get('id');
    if (uniId) {
      this.store.loadUniversityDetails(uniId);
    } else if (!this.store.selectedUniversity()) {
      // Fallback load default top uni if accessed directly without param
      this.store.loadUniversityDetails('tsmu-georgia');
    }
  }

  protected goBackToRecommendations(): void {
    this.router.navigate(['/dynamic/cse/recommendations']);
  }
}
