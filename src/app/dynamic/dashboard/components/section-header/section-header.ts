import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon } from '../../../../shared/ui/icon/icon';

@Component({
  selector: 'app-section-header',
  standalone: true,
  imports: [Icon, RouterLink],
  templateUrl: './section-header.html',
  styleUrl: './section-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionHeader {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly count = input<string>();
  readonly actionLabel = input<string>();
  readonly actionLink = input<string>();
  readonly actionFragment = input<string>();
  readonly headingId = input<string>();
}
