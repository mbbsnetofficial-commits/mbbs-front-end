import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Faq } from '../../models/faq.model';

@Component({
  selector: 'app-faq-section',
  standalone: true,
  template: `
    <section aria-labelledby="faqs-title">
      <h2 id="faqs-title">Frequently Asked Questions</h2>
      @for (faq of faqs(); track faq._id) {
        <details><summary>{{ faq.question }}</summary><p>{{ faq.answer }}</p></details>
      }
    </section>
  `,
  styles: [`
    section{margin-top:3rem}h2{margin-bottom:1rem;color:#17313c;font-family:Georgia,serif;font-size:1.7rem}details{border-top:1px solid #dce4e8}details:last-child{border-bottom:1px solid #dce4e8}summary{padding:1rem 0;color:#263f49;font-weight:800;cursor:pointer}p{padding:0 1rem 1rem 0;color:#60717a;line-height:1.65}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FaqSection {
  readonly faqs = input.required<Faq[]>();
}
