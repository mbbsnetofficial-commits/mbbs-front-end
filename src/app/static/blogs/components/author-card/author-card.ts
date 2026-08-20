import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ImageFallbackDirective } from '../../../../shared/ui/media/image-fallback.directive';
import { Author } from '../../models/author.model';

@Component({
  selector: 'app-author-card',
  standalone: true,
  imports: [ImageFallbackDirective, RouterLink],
  templateUrl: './author-card.html',
  styleUrl: './author-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthorCard {
  readonly author = input.required<Author>();
}
