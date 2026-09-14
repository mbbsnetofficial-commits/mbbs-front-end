import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-logo-loader',
  standalone: true,
  templateUrl: './logo-loader.component.html',
  styleUrl: './logo-loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogoLoader {
  readonly message = input<string>('');
  readonly size = input<number>(56);
  readonly fullScreen = input<boolean>(false);
}
