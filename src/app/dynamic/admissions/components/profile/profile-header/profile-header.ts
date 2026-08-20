import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { StudentProfile } from '../../../models/student-profile.model';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { ImageFallbackDirective } from '../../../../../shared/ui/media/image-fallback.directive';

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [Icon, ImageFallbackDirective, DatePipe],
  templateUrl: './profile-header.html',
  styleUrl: './profile-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileHeaderComponent {
  readonly profile = input.required<StudentProfile>();

  readonly toggleDiscoverability = output<void>();
  readonly editModeToggled = output<void>();
}
