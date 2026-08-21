import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-blog-empty-state',
  standalone: true,
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyState {
  readonly message = input('No content is available yet.');
}
