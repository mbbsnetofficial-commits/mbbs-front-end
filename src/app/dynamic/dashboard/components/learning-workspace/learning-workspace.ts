import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HomeBlog } from '../../../../core/models/home.model';
import { BookmarkService } from '../../../../core/serivce/bookmark.service';
import { Icon } from '../../../../shared/ui/icon/icon';

@Component({
  selector: 'app-learning-workspace',
  standalone: true,
  imports: [DatePipe, Icon, RouterLink],
  templateUrl: './learning-workspace.html',
  styleUrl: './learning-workspace.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LearningWorkspace {
  private readonly bookmarks = inject(BookmarkService);

  readonly articles = input.required<readonly HomeBlog[]>();
  protected readonly saved = computed(() => this.bookmarks.filter(this.articles()));
}
