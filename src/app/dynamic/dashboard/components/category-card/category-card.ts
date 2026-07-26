import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BlogCategory } from '../../../../core/models/home.model';
import { Icon } from '../../../../shared/ui/icon/icon';
import { ImageFallbackDirective } from '../../../../shared/ui/media/image-fallback.directive';
import { MediaUrlPipe } from '../../../../shared/ui/media/media-url.pipe';

@Component({
  selector: 'app-category-card',
  standalone: true,
  imports: [Icon, ImageFallbackDirective, MediaUrlPipe, RouterLink],
  templateUrl: './category-card.html',
  styleUrl: './category-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryCard {
  readonly category = input.required<BlogCategory>();
}
