import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  signal
} from '@angular/core';

import { Comment } from '../../models/comment.model';
import { CommentService } from '../../services/comment.service';

@Component({
  selector: 'app-community-feed',
  standalone: true,
  imports: [],
  templateUrl: './community-feed.html',
  styleUrl: './community-feed.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommunityFeed implements OnInit {
  /** Pass the blog slug from the parent to scope comments */
  readonly slug = input.required<string>();

  private readonly commentService = inject(CommentService);

  /* ── State ── */
  readonly comments   = signal<Comment[]>([]);
  readonly loading    = signal(false);
  readonly error      = signal<string | null>(null);
  readonly submitting = signal(false);

  /* ── Compose / Edit ── */
  readonly composerText  = signal('');
  readonly editingId     = signal<string | null>(null);
  readonly editText      = signal('');

  /* ── Sort ── */
  readonly sortOptions = ['Relevance', 'Latest', 'Most Liked'];
  readonly activeSort  = signal('Relevance');
  readonly showSort    = signal(false);

  /* ── Pagination ── */
  private page  = 1;
  private limit = 10;

  ngOnInit(): void {
    this.load();
  }

  /* ─────────────── Load ─────────────── */
  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.commentService.getComments(this.slug(), this.page, this.limit).subscribe({
      next: res => {
        this.comments.set(res.data.comments);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load discussions. Please try again.');
        this.loading.set(false);
      }
    });
  }

  onEnter(event: Event): void {
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) {
      ke.preventDefault();
      this.submitComment();
    }
  }

  /* ─────────────── Submit new comment ─────────────── */
  submitComment(): void {
    const text = this.composerText().trim();
    if (!text || this.submitting()) return;

    this.submitting.set(true);
    this.commentService.postComment(this.slug(), text).subscribe({
      next: res => {
        this.comments.update(list => [res.data, ...list]);
        this.composerText.set('');
        this.submitting.set(false);
      },
      error: () => this.submitting.set(false)
    });
  }

  /* ─────────────── Edit ─────────────── */
  startEdit(comment: Comment): void {
    this.editingId.set(comment.id);
    this.editText.set(comment.comment);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editText.set('');
  }

  saveEdit(comment: Comment): void {
    const text = this.editText().trim();
    if (!text) return;

    this.commentService.updateComment(this.slug(), comment.id, text).subscribe({
      next: res => {
        this.comments.update(list =>
          list.map(c => c.id === comment.id ? res.data : c)
        );
        this.cancelEdit();
      }
    });
  }

  /* ─────────────── Delete ─────────────── */
  deleteComment(comment: Comment): void {
    if (!confirm('Delete this comment?')) return;
    this.commentService.deleteComment(this.slug(), comment.id).subscribe({
      next: () =>
        this.comments.update(list => list.filter(c => c.id !== comment.id))
    });
  }

  /* ─────────────── Like / Unlike ─────────────── */
  toggleLike(comment: Comment): void {
    const action$ = comment.isLiked
      ? this.commentService.unlikeComment(this.slug(), comment.id)
      : this.commentService.likeComment(this.slug(), comment.id);

    // Optimistic update
    this.comments.update(list =>
      list.map(c => c.id === comment.id
        ? { ...c, isLiked: !c.isLiked, totalLikes: c.isLiked ? c.totalLikes - 1 : c.totalLikes + 1 }
        : c
      )
    );

    action$.subscribe({
      error: () => {
        // Rollback on failure
        this.comments.update(list =>
          list.map(c => c.id === comment.id
            ? { ...c, isLiked: !c.isLiked, totalLikes: c.isLiked ? c.totalLikes - 1 : c.totalLikes + 1 }
            : c
          )
        );
      }
    });
  }

  /* ─────────────── Helpers ─────────────── */
  timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60)   return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  setSort(opt: string): void {
    this.activeSort.set(opt);
    this.showSort.set(false);
  }
}
