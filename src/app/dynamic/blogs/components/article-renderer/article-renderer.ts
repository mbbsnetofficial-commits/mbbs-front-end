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
          @case ('paragraph') { <p>{{ block.text }}</p> }
          @case ('quote') { <blockquote>{{ block.text }}</blockquote> }
          @case ('image') { <img appImageFallback [src]="block.text" alt=""> }
          @case ('video') { <a class="media-link" [href]="block.text" target="_blank" rel="noopener">Watch video ↗</a> }
          @case ('list') {
            <ul>@for (item of listItems(block.text); track $index) { <li>{{ item }}</li> }</ul>
          }
          @case ('ordered-list') {
            <ol>@for (item of listItems(block.text); track $index) { <li>{{ item }}</li> }</ol>
          }
          @default { <p>{{ block.text }}</p> }
        }
      }
    </div>
  `,
  styles: [`
    .article{color:#2c414b;font-family:Georgia,serif;font-size:1.08rem;line-height:1.85}.article>*{margin:0 0 1.35rem}.article h2{margin-top:2.4rem;color:#17313c;font-size:clamp(1.7rem,3vw,2.25rem);line-height:1.25}.article h3{margin-top:2rem;color:#1d3944;font-size:1.4rem}.article p{white-space:pre-line}.article blockquote{padding:1.25rem 1.5rem;border-left:4px solid #168477;color:#34525b;background:#edf6f4;font-size:1.25rem;font-style:italic}.article ul,.article ol{padding-left:1.5rem}.article li{margin:.45rem 0}.article img{width:100%;max-height:35rem;border-radius:.8rem;object-fit:cover;background:#e5ecef}.article img.image-failed{display:none}.media-link{display:inline-flex;padding:.75rem 1rem;border-radius:.6rem;color:#fff;background:#147568;font-family:Inter,sans-serif;font-size:.8rem;font-weight:800;text-decoration:none}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArticleRenderer {
  readonly blocks = input.required<ContentBlock[]>();

  protected listItems(text: string): string[] {
    return text.split(/\r?\n|,\s*/).map((item) => item.replace(/^[-*]\s*/, '').trim()).filter(Boolean);
  }
}
