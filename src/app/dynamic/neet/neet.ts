import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { QodComponent } from './qod/qod';
import { Icon } from '../../shared/ui/icon/icon';
import { PreviousYearQuestions } from './previous-year-questions/previous-year-questions';

@Component({
  selector: 'app-neet',
  standalone: true,
  imports: [
    Icon,
    QodComponent,
    RouterLink,
    PreviousYearQuestions
  ],
  templateUrl: './neet.html',
  styleUrl: './neet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NeetComponent {

}
