import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon } from '../../../../shared/ui/icon/icon';

@Component({
  selector: 'app-dashboard-hero',
  standalone: true,
  imports: [Icon, RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Hero {
  readonly userName = input('Student');
}
