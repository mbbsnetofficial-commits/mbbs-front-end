import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { BlogCategory } from '../../../../core/models/home.model';
import { CategoryCard } from '../category-card/category-card';
import { EmptyState } from '../empty-state/empty-state';
import { SectionHeader } from '../section-header/section-header';

@Component({
  selector: 'app-dashboard-categories',
  standalone: true,
  imports: [CategoryCard, EmptyState, SectionHeader],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Categories {
  readonly categories = input.required<readonly BlogCategory[]>();
}
