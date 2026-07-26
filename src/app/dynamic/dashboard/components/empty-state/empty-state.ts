import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon, IconName } from '../../../../shared/ui/icon/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [Icon, RouterLink],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyState {
  readonly icon = input<IconName>('sparkles');
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly actionLabel = input<string>();
  readonly actionLink = input<string>();
  readonly compact = input(false);
}
