import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Video } from '../../models/video.model';

@Component({
  selector: 'app-video-section',
  standalone: true,
  template: `
    <section aria-labelledby="videos-title">
      <h2 id="videos-title">Videos</h2>
      <div class="list">
        @for (video of videos(); track video._id) {
          <a [href]="video.url" target="_blank" rel="noopener"><span aria-hidden="true">▶</span><strong>{{ video.title }}</strong><small>Open video ↗</small></a>
        }
      </div>
    </section>
  `,
  styles: [`
    section{margin-top:3rem}h2{margin-bottom:1rem;color:#17313c;font-family:Georgia,serif;font-size:1.7rem}.list{display:grid;gap:.7rem}a{display:grid;grid-template-columns:2.5rem 1fr auto;align-items:center;gap:.8rem;padding:1rem;border:1px solid #dce5e8;border-radius:.8rem;color:#203d47;background:#f8fbfb;text-decoration:none;transition:.2s}a:hover{border-color:#71b2a8;transform:translateY(-2px)}a>span{width:2.5rem;height:2.5rem;display:grid;place-items:center;border-radius:50%;color:#fff;background:#147568}small{color:#168477}@media(max-width:520px){a{grid-template-columns:2.5rem 1fr}small{display:none}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoSection {
  readonly videos = input.required<Video[]>();
}
