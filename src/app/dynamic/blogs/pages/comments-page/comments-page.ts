import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { Comment } from '../../models/comment.model';
import { CommentService } from '../../services/comment.service';

@Component({
  selector: 'app-blog-comments-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './comments-page.html',
  styleUrl: './comments-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommentsPage implements OnInit {
  private readonly commentService = inject(CommentService);
  private readonly route          = inject(ActivatedRoute);

  private readonly slug$ = toSignal(
    this.route.paramMap.pipe(map(p => p.get('slug') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('slug') ?? '' }
  );

  readonly comments    = signal<Comment[]>([]);
  readonly loading     = signal(false);
  readonly submitting  = signal(false);
  readonly composerText = signal('');
  readonly expandedIds  = signal<Set<string>>(new Set());
  readonly page         = signal(1);
  readonly hasMore      = signal(false);
  readonly total        = signal(0);

  private readonly limit = 10;

  get slug(): string { return this.slug$(); }

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(pageNum: number): void {
    this.loading.set(true);
    this.commentService.getComments(this.slug, pageNum, this.limit).subscribe({
      next: res => {
        const incoming = res.data.comments;
        this.total.set(res.data.pagination.total);
        this.comments.update(list =>
          pageNum === 1 ? incoming : [...list, ...incoming]
        );
        this.page.set(pageNum);
        this.hasMore.set(pageNum < res.data.pagination.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadMore(): void {
    this.loadPage(this.page() + 1);
  }

  post(): void {
    const text = this.composerText().trim();
    if (!text || this.submitting()) return;
    this.submitting.set(true);
    this.commentService.postComment(this.slug, text).subscribe({
      next: res => {
        this.comments.update(list => [res.data, ...list]);
        this.total.update(t => t + 1);
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

  toggleLike(comment: Comment): void {
    const action$ = comment.isLiked
      ? this.commentService.unlikeComment(this.slug, comment.id)
      : this.commentService.likeComment(this.slug, comment.id);

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

  toggleExpand(id: string): void {
    this.expandedIds.update(set => {
      const copy = new Set(set);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  }

  isExpanded(id: string): boolean { return this.expandedIds().has(id); }

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
