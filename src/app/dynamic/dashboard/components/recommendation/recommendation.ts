import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HomeBlog } from '../../../../core/models/home.model';
import { Icon } from '../../../../shared/ui/icon/icon';
import { EmptyState } from '../empty-state/empty-state';

@Component({
  selector: 'app-recommendation',
  standalone: true,
  imports: [EmptyState, Icon, RouterLink],
  templateUrl: './recommendation.html',
  styleUrl: './recommendation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Recommendation {
  readonly recommendations = input.required<readonly HomeBlog[]>();
}
