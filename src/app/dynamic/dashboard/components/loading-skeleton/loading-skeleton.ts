import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  templateUrl: './loading-skeleton.html',
  styleUrl: './loading-skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingSkeleton {}
