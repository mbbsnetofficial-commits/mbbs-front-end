import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'safeMarkdown',
  standalone: true,
})
export class SafeMarkdownPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    if (!value) {
      return '';
    }

    const html = this.parseMarkdownToSafeHtml(value);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private parseMarkdownToSafeHtml(rawText: string): string {
    // Step 1: Escape HTML entities to prevent XSS
    const escaped = rawText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const lines = escaped.split(/\r?\n/);
    const outputBlocks: string[] = [];

    let inUl = false;
    let inOl = false;

    const closeLists = () => {
      if (inUl) {
        outputBlocks.push('</ul>');
        inUl = false;
      }
      if (inOl) {
        outputBlocks.push('</ol>');
        inOl = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        closeLists();
        continue;
      }

      // Check for headings
      const h3Match = trimmed.match(/^###\s+(.+)$/);
      if (h3Match) {
        closeLists();
        outputBlocks.push(`<h3>${this.parseInline(h3Match[1])}</h3>`);
        continue;
      }

      const h2Match = trimmed.match(/^##\s+(.+)$/);
      if (h2Match) {
        closeLists();
        outputBlocks.push(`<h2>${this.parseInline(h2Match[1])}</h2>`);
        continue;
      }

      const h1Match = trimmed.match(/^#\s+(.+)$/);
      if (h1Match) {
        closeLists();
        outputBlocks.push(`<h1>${this.parseInline(h1Match[1])}</h1>`);
        continue;
      }

      // Check for bullet list (•, -, *)
      const bulletMatch = trimmed.match(/^[•\-\*]\s+(.+)$/);
      if (bulletMatch) {
        if (inOl) {
          outputBlocks.push('</ol>');
          inOl = false;
        }
        if (!inUl) {
          outputBlocks.push('<ul>');
          inUl = true;
        }
        outputBlocks.push(`<li>${this.parseInline(bulletMatch[1])}</li>`);
        continue;
      }

      // Check for numbered list (e.g. 1. , 2. )
      const numberMatch = trimmed.match(/^\d+\.\s+(.+)$/);
      if (numberMatch) {
        if (inUl) {
          outputBlocks.push('</ul>');
          inUl = false;
        }
        if (!inOl) {
          outputBlocks.push('<ol>');
          inOl = true;
        }
        outputBlocks.push(`<li>${this.parseInline(numberMatch[1])}</li>`);
        continue;
      }

      // Regular paragraph or plain line
      closeLists();
      outputBlocks.push(`<p>${this.parseInline(trimmed)}</p>`);
    }

    closeLists();
    return outputBlocks.join('');
  }

  private parseInline(text: string): string {
    return text
      // Bold: **text** or __text__
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      // Italic: *text* or _text_
      .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
      .replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>')
      // Markdown links: [title](url)
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
      )
      // Bare URLs: https://...
      .replace(
        /(?<!href="|">)(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
      );
  }
}
