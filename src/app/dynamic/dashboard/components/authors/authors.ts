import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { BlogAuthor } from '../../../../core/models/home.model';
import { AuthorCard } from '../author-card/author-card';
import { EmptyState } from '../empty-state/empty-state';
import { SectionHeader } from '../section-header/section-header';

@Component({
  selector: 'app-dashboard-authors',
  standalone: true,
  imports: [AuthorCard, EmptyState, SectionHeader],
  templateUrl: './authors.html',
  styleUrl: './authors.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Authors {
  readonly authors = input.required<readonly BlogAuthor[]>();
}
