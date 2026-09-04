import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Marked, Tokens } from 'marked';

@Pipe({
  name: 'safeMarkdown',
  standalone: true,
})
export class SafeMarkdownPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly markedInstance: Marked;

  constructor() {
    this.markedInstance = new Marked({
      gfm: true,
      breaks: true,
    });

    this.markedInstance.use({
      renderer: {
        table(this: any, token: Tokens.Table): string {
          let headerCells = '';
          for (const cell of token.header) {
            const alignAttr = cell.align ? ` align="${cell.align}"` : '';
            headerCells += `<th${alignAttr}>${this.parser.parseInline(cell.tokens)}</th>`;
          }

          let bodyRows = '';
          for (const row of token.rows) {
            let rowCells = '';
            for (const cell of row) {
              const alignAttr = cell.align ? ` align="${cell.align}"` : '';
              rowCells += `<td${alignAttr}>${this.parser.parseInline(cell.tokens)}</td>`;
            }
            bodyRows += `<tr>${rowCells}</tr>`;
          }

          return `<div class="table-responsive"><table class="markdown-table"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
        },
        link(this: any, token: Tokens.Link): string {
          const href = (token.href || '').trim();
          if (/^(javascript|data|vbscript):/i.test(href)) {
            return `[${token.text}](${token.href})`;
          }
          const titleAttr = token.title ? ` title="${token.title}"` : '';
          const text = this.parser.parseInline(token.tokens);
          return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
        },
        list(this: any, token: Tokens.List): string {
          const tag = token.ordered ? 'ol' : 'ul';
          let body = '';
          for (const item of token.items) {
            body += this.listitem(item);
          }
          return `<${tag}>${body}</${tag}>`;
        },
        listitem(this: any, item: Tokens.ListItem): string {
          const text = this.parser.parseInline(item.tokens);
          return `<li>${text}</li>`;
        },
      },
    });
  }

  transform(value: string | null | undefined): SafeHtml {
    if (!value) {
      return '';
    }

    const html = this.parseMarkdownToSafeHtml(value);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private parseMarkdownToSafeHtml(rawText: string): string {
    // Normalize unicode bullet points (•) to standard markdown list items
    let processed = rawText.replace(/^([ \t]*)•\s+/gm, '$1- ');

    // Escape raw HTML entities to prevent XSS injection before parsing
    processed = processed
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const parsed = this.markedInstance.parse(processed, { async: false });
    return typeof parsed === 'string' ? parsed.trim() : '';
  }
}


