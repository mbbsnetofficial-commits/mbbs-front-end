import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ImageFallbackDirective } from '../../../../../shared/ui/media/image-fallback.directive';
import { GalleryImage } from '../../models/gallery.model';

@Component({
  selector: 'app-blog-gallery',
  standalone: true,
  imports: [ImageFallbackDirective],
  template: `
    <section aria-labelledby="gallery-title">
      <h2 id="gallery-title">Gallery</h2>
      <div class="grid">
        @for (image of images(); track image._id) {
          <figure><img appImageFallback [src]="image.url" [alt]="image.alt" loading="lazy"><figcaption>{{ image.alt }}</figcaption></figure>
        }
      </div>
    </section>
  `,
  styles: [`
    section{margin-top:3rem}h2{margin-bottom:1rem;color:#17313c;font-family:Georgia,serif;font-size:1.7rem}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem}figure{overflow:hidden;border-radius:.8rem;background:#e5ecef}img{width:100%;height:17rem;display:block;object-fit:cover}.image-failed{visibility:hidden}figcaption{padding:.6rem;color:#6d7d85;font-size:.7rem}@media(max-width:560px){.grid{grid-template-columns:1fr}img{height:14rem}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Gallery {
  readonly images = input.required<GalleryImage[]>();
}
