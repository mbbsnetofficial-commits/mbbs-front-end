import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Author } from '../../models/author.model';

@Component({
  selector: 'app-author-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './author-card.html',
  styleUrl: './author-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthorCard {
  readonly author = input.required<Author>();
}
