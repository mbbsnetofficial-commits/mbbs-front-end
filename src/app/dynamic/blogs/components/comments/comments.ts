import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  signal
} from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { Comment } from '../../models/comment.model';
import { CommentService } from '../../services/comment.service';

/** How many comments to show inline before "Load more" redirects */
const INLINE_LIMIT = 3;

@Component({
  selector: 'app-blog-comments',
  standalone: true,
  imports: [],
  templateUrl: './comments.html',
  styleUrl: './comments.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Comments implements OnInit {
  /** Blog slug — required so we can call the API */
  readonly slug  = input.required<string>();
  /** Total comment count from the blog object */
  readonly total = input.required<number>();

  private readonly commentService = inject(CommentService);
  private readonly router         = inject(Router);
  private readonly route          = inject(ActivatedRoute);

  /* ── State ── */
  readonly comments    = signal<Comment[]>([]);
  readonly loading     = signal(false);
  readonly submitting  = signal(false);
  readonly composerText = signal('');
  readonly expandedIds  = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.commentService.getComments(this.slug(), 1, INLINE_LIMIT).subscribe({
      next: res => {
        this.comments.set(res.data.comments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  /* ── Post ── */
  post(): void {
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

  onEnter(event: Event): void {
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) { ke.preventDefault(); this.post(); }
  }

  /* ── Like / Unlike ── */
  toggleLike(comment: Comment): void {
    const action$ = comment.isLiked
      ? this.commentService.unlikeComment(this.slug(), comment.id)
      : this.commentService.likeComment(this.slug(), comment.id);

    // Optimistic
    this.comments.update(list => list.map(c =>
      c.id === comment.id
        ? { ...c, isLiked: !c.isLiked, totalLikes: c.isLiked ? c.totalLikes - 1 : c.totalLikes + 1 }
        : c
    ));

    action$.subscribe({
      error: () => this.comments.update(list => list.map(c =>
        c.id === comment.id
          ? { ...c, isLiked: !c.isLiked, totalLikes: c.isLiked ? c.totalLikes - 1 : c.totalLikes + 1 }
          : c
      ))
    });
  }

  /* ── Show more / less toggle ── */
  toggleExpand(id: string): void {
    this.expandedIds.update(set => {
      const copy = new Set(set);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  }

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  /* ── Navigate to full comments page ── */
  loadMore(): void {
    this.router.navigate(['/dynamic/blogs', this.slug(), 'comments']);
  }

  /* ── Helpers ── */
  timeAgo(dateStr: string): string {
    const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (s < 60)    return 'just now';
    if (s < 3600)  return `${Math.floor(s / 60)}min`;
    if (s < 86400) return `${Math.floor(s / 3600)}hr`;
    return `${Math.floor(s / 86400)}d`;
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
}
