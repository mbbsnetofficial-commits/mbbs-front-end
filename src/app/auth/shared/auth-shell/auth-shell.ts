import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon } from '../../../shared/ui/icon/icon';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [Icon, RouterLink],
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthShell {
  readonly eyebrow = input.required<string>();
  readonly headline = input.required<string>();
  readonly description = input.required<string>();
}
