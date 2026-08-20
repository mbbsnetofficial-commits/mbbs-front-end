import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Blog } from '../../models/blog.model';
import { BlogCard } from '../blog-card/blog-card';

@Component({
  selector: 'app-related-blogs',
  standalone: true,
  imports: [BlogCard],
  template: `
    <section aria-labelledby="related-title">
      <h2 id="related-title">Continue Reading</h2>
      <div>@for (blog of blogs(); track blog._id) { <app-blog-card [blog]="blog"/> }</div>
    </section>
  `,
  styles: [`section{margin-top:3.5rem;padding-top:2rem;border-top:1px solid #dce4e8}h2{color:#17313c;font-family:Georgia,serif;font-size:1.7rem}`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RelatedBlogs {
  readonly blogs = input.required<Blog[]>();
}
