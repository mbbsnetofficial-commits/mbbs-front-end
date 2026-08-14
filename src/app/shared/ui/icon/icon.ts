import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'activity'
  | 'arrow-right'
  | 'authors'
  | 'bell'
  | 'bookmark'
  | 'categories'
  | 'chart'
  | 'chat'
  | 'check'
  | 'chevron'
  | 'clock'
  | 'close'
  | 'dashboard'
  | 'daily'
  | 'flame'
  | 'globe'
  | 'heart'
  | 'history'
  | 'india'
  | 'like'
  | 'logout'
  | 'menu'
  | 'microscope'
  | 'moon'
  | 'profile'
  | 'quote'
  | 'retry'
  | 'search'
  | 'settings'
  | 'share'
  | 'sparkles'
  | 'sun'
  | 'test'
  | 'plus'
  | 'asterisk'
  | 'mic'
  | 'waveform'
  | 'pencil'
  | 'graduation-cap'
  | 'code'
  | 'coffee'
  | 'lightbulb';

@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
  readonly strokeWidth = input(1.8);
}
