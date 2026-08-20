import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ImageFallbackDirective } from '../../../../shared/ui/media/image-fallback.directive';
import { Blog } from '../../models/blog.model';

@Component({
  selector: 'app-blog-hero',
  standalone: true,
  imports: [DatePipe, ImageFallbackDirective, RouterLink],
  template: `
    <header class="hero">
      <a class="back" routerLink="/blogs">← Back to Feed</a>
      <span class="category">{{ blog().category?.categoryName ?? 'Uncategorized' }}</span>
      <h1>{{ blog().title || 'Untitled article' }}</h1>
      <p>{{ displayExcerpt() }}</p>
      <div class="meta">
        <img appImageFallback [src]="blog().author?.profileImage ?? ''" [alt]="blog().author?.fullName ?? 'Author'">
        <span>
          <strong>{{ blog().author?.fullName ?? 'MBBS.NET' }}</strong>
          <small>{{ blog().author?.designation ?? '' }}</small>
        </span>
        <time [attr.datetime]="blog().publishedAt">{{ blog().publishedAt | date: 'mediumDate' }}</time>
        <span>{{ blog().readingTime ?? 0 }} min read</span>
      </div>
      @if (blog().featuredImage?.url; as imageUrl) {
        <figure>
          <img appImageFallback [src]="imageUrl" [alt]="blog().featuredImage?.alt || blog().title || 'Blog image'">
          @if (blog().featuredImage?.caption; as caption) { <figcaption>{{ caption }}</figcaption> }
        </figure>
      }
    </header>
  `,
  styles: [`
    .hero{padding-top:1rem}.back{display:inline-block;margin-bottom:2rem;color:#147568;font-size:.8rem;font-weight:800;text-decoration:none}.category{color:#147568;font-size:.7rem;font-weight:850;letter-spacing:.1em;text-transform:uppercase}h1{max-width:58rem;margin:.65rem 0 1rem;color:#142f3b;font-family:Georgia,serif;font-size:clamp(2.3rem,6vw,4.6rem);font-weight:500;line-height:1.04;letter-spacing:-.04em}p{max-width:48rem;color:#5f7079;font-size:clamp(1rem,2vw,1.25rem);line-height:1.65}.meta{display:flex;align-items:center;flex-wrap:wrap;gap:.7rem;margin:1.5rem 0;color:#74828a;font-size:.75rem}.meta img{width:2.6rem;height:2.6rem;border-radius:50%;object-fit:cover;background:#e5ecef}.meta span:has(strong){display:grid;margin-right:.5rem}.meta strong{color:#29434e}.meta small{margin-top:.1rem}figure{margin-top:2rem}figure>img{width:100%;max-height:38rem;display:block;border-radius:1rem;object-fit:cover;background:#e5ecef}.image-failed{visibility:hidden;min-height:18rem}figcaption{padding-top:.5rem;color:#7c8990;font-size:.7rem;text-align:center}@media(max-width:600px){h1{font-size:2.35rem}.meta time{width:100%;margin-left:3.3rem}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogHero {
  readonly blog = input.required<Blog>();

  protected displayExcerpt(): string {
    const blog = this.blog();
    const excerpt = blog.excerpt?.trim() ?? '';

    if (!excerpt.startsWith('{"blocks"')) {
      return excerpt;
    }

    return blog.shortDescription?.trim()
      || blog.content?.blocks?.[0]?.text?.trim()
      || '';
  }
}
