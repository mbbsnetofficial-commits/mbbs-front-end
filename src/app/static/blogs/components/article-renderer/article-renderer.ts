import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ImageFallbackDirective } from '../../../../shared/ui/media/image-fallback.directive';
import { ContentBlock } from '../../models/content-block.model';

@Component({
  selector: 'app-article-renderer',
  standalone: true,
  imports: [ImageFallbackDirective],
  template: `
    <div class="article">
      @for (block of blocks(); track $index) {
        @switch (block.type.toLowerCase()) {
          @case ('heading') { <h2>{{ block.text }}</h2> }
          @case ('subheading') { <h3>{{ block.text }}</h3> }
          @case ('paragraph') {
            @for (paragraph of paragraphChunks(block.text); track $index) {
              <p>{{ paragraph }}</p>
            }
          }
          @case ('quote') { <blockquote>{{ block.text }}</blockquote> }
          @case ('image') { <img appImageFallback [src]="block.text" alt=""> }
          @case ('video') { <a class="media-link" [href]="block.text" target="_blank" rel="noopener">Watch video ↗</a> }
          @case ('list') {
            <ul>@for (item of listItems(block.text); track $index) { <li>{{ item }}</li> }</ul>
          }
          @case ('ordered-list') {
            <ol>@for (item of listItems(block.text); track $index) { <li>{{ item }}</li> }</ol>
          }
          @default {
            @for (paragraph of paragraphChunks(block.text); track $index) {
              <p>{{ paragraph }}</p>
            }
          }
        }
      }
    </div>
  `,
  styles: [`
    .article{color:#344854;font-family:Georgia,serif;font-size:1.08rem;line-height:1.9}
    .article>*{margin:0 0 1.35rem}
    .article h2{margin:2.8rem 0 1rem;color:#142f3b;font-size:clamp(1.75rem,3vw,2.35rem);line-height:1.22;letter-spacing:-.03em}
    .article h3{margin:2.2rem 0 .85rem;color:#1b3a45;font-size:1.42rem;line-height:1.3}
    .article p{max-width:68ch;color:#415865;white-space:pre-line}
    .article blockquote{max-width:62ch;padding:1.35rem 1.5rem;border:1px solid #d9ebe7;border-left:4px solid #168477;border-radius:.9rem;color:#2f4b55;background:#f4fbf9;font-size:1.18rem;font-style:italic}
    .article ul,.article ol{max-width:62ch;padding-left:1.5rem}
    .article li{margin:.55rem 0;color:#415865}
    .article img{width:100%;max-height:35rem;display:block;border-radius:1rem;object-fit:cover;background:#e5ecef;box-shadow:0 16px 34px rgba(20,47,59,.08)}
    .article img.image-failed{display:none}
    .media-link{display:inline-flex;padding:.8rem 1.05rem;border-radius:.75rem;color:#fff;background:#147568;font-family:Inter,sans-serif;font-size:.8rem;font-weight:800;text-decoration:none}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArticleRenderer {
  readonly blocks = input.required<ContentBlock[]>();

  protected paragraphChunks(text: string): string[] {
    const normalized = text
      .replace(/\r/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!normalized) {
      return [];
    }

    return normalized
      .split(/\n\s*\n/)
      .map((chunk) => chunk.trim())
      .filter(Boolean);
  }

  protected listItems(text: string): string[] {
    return text.split(/\r?\n|,\s*/).map((item) => item.replace(/^[-*]\s*/, '').trim()).filter(Boolean);
  }
}
