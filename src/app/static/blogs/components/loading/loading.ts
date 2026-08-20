import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-blog-loading',
  standalone: true,
  templateUrl: './loading.html',
  styleUrl: './loading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Loading {
  readonly label = input('Loading blog content');
}
