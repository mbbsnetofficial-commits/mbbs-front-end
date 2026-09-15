import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

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
  readonly overlay = input<boolean>(false);
  readonly showProgress = input<boolean>(true);

  readonly currentSrc = signal<string>('/images/app-logo.png');

  onImageError(): void {
    if (this.currentSrc() !== '/Asset 1@4x.png') {
      this.currentSrc.set('/Asset 1@4x.png');
    }
  }
}
