import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

import { BlogAuthor } from '../../../../core/models/home.model';
import { Icon } from '../../../../shared/ui/icon/icon';
import { ImageFallbackDirective } from '../../../../shared/ui/media/image-fallback.directive';
import { MediaUrlPipe } from '../../../../shared/ui/media/media-url.pipe';

@Component({
  selector: 'app-author-card',
  standalone: true,
  imports: [Icon, ImageFallbackDirective, MediaUrlPipe],
  templateUrl: './author-card.html',
  styleUrl: './author-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthorCard {
  readonly author = input.required<BlogAuthor>();
  protected readonly following = signal(false);
}
