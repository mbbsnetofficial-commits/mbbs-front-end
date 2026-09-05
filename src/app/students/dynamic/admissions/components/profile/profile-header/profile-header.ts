import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { StudentProfile } from '../../../models/student-profile.model';
import { Icon } from '../../../../../../shared/ui/icon/icon';
import { ImageFallbackDirective } from '../../../../../../shared/ui/media/image-fallback.directive';

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
  readonly photoSelected = output<File>();

  get userInitial(): string {
    const name = this.profile().personal?.fullName?.trim() || '';
    const clean = name.replace(/^[^a-zA-Z0-9]+/, '');
    return clean ? clean.charAt(0).toUpperCase() : 'S';
  }

  get hasCustomAvatar(): boolean {
    const url = this.profile().avatarUrl?.trim();
    return !!url && url !== '/images/profile.jpg';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.photoSelected.emit(input.files[0]);
    }
  }

  formatLocation(city?: string, country?: string): string {
    if (city && country) return `${city}, ${country}`;
    if (city) return city;
    if (country) return country;
    return '';
  }
}
