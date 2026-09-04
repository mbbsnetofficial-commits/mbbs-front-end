import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { SafeMarkdownPipe } from './safe-markdown.pipe';

describe('SafeMarkdownPipe', () => {
  let pipe: SafeMarkdownPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SafeMarkdownPipe],
    });
    pipe = TestBed.inject(SafeMarkdownPipe);
    sanitizer = TestBed.inject(DomSanitizer);
  });

  it('should be created', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for null or empty input', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should format headings (h1, h2, h3)', () => {
    const markdown = '# Main Title\n## Sub Title\n### Section Title';
    const result = pipe.transform(markdown) as any;
    const html = result.changingThisBreaksApplicationSecurity || result.toString();
    expect(html).toContain('<h1>Main Title</h1>');
    expect(html).toContain('<h2>Sub Title</h2>');
    expect(html).toContain('<h3>Section Title</h3>');
  });

  it('should format bold and italic inline styles', () => {
    const markdown = 'This is **bold** and this is *italic* text.';
    const result = pipe.transform(markdown) as any;
    const html = result.changingThisBreaksApplicationSecurity || result.toString();
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
  });

  it('should format bullet lists and numbered lists', () => {
    const markdown = '• Item 1\n• Item 2\n- Item 3\n\n1. First\n2. Second';
    const result = pipe.transform(markdown) as any;
    const html = result.changingThisBreaksApplicationSecurity || result.toString();
    expect(html).toContain('<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>');
    expect(html).toContain('<ol><li>First</li><li>Second</li></ol>');
  });

  it('should format links and prevent XSS injections', () => {
    const markdown =
      '<script>alert("xss")</script> Visit [MBBS](https://mbbs.net) or https://example.com';
    const result = pipe.transform(markdown) as any;
    const html = result.changingThisBreaksApplicationSecurity || result.toString();
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain(
      '<a href="https://mbbs.net" target="_blank" rel="noopener noreferrer">MBBS</a>'
    );
    expect(html).toContain(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">https://example.com</a>'
    );
  });

  it('should sanitize event handlers and disallow javascript: pseudo-protocol URLs', () => {
    const input = '<img src="x" onerror="alert(1)"> [Click](javascript:alert(1)) onclick=alert(2)';
    const result = pipe.transform(input) as any;
    const html = result.changingThisBreaksApplicationSecurity || result.toString();
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
    expect(html).not.toContain('<a href="javascript:');
    expect(html).toContain('[Click](javascript:alert(1))');
  });

  it('should format GFM markdown tables into responsive HTML tables', () => {
    const markdown =
      '| Country | Duration | Requirements |\n' +
      '| --- | --- | --- |\n' +
      '| Russia | 6 Years | NEET qualified |\n' +
      '| Georgia | 6 Years | 50% PCB + NEET |';
    const result = pipe.transform(markdown) as any;
    const html = result.changingThisBreaksApplicationSecurity || result.toString();
    expect(html).toContain('<div class="table-responsive">');
    expect(html).toContain('<table class="markdown-table">');
    expect(html).toContain('<thead><tr><th>Country</th><th>Duration</th><th>Requirements</th></tr></thead>');
    expect(html).toContain('<td>Russia</td>');
    expect(html).toContain('<td>6 Years</td>');
    expect(html).toContain('<td>NEET qualified</td>');
    expect(html).toContain('<td>Georgia</td>');
  });

  it('should support table alignments and rich inline markdown with links in cells', () => {
    const markdown =
      '| Country | Fees | Official Portal |\n' +
      '| :--- | :---: | ---: |\n' +
      '| **Russia** | $4,500/yr | [Apply Now](https://mbbs.net/russia) |\n' +
      '| *Kazakhstan* | $3,800/yr | https://mbbs.net/kazakhstan |';
    const result = pipe.transform(markdown) as any;
    const html = result.changingThisBreaksApplicationSecurity || result.toString();
    expect(html).toContain('<th align="left">Country</th>');
    expect(html).toContain('<th align="center">Fees</th>');
    expect(html).toContain('<th align="right">Official Portal</th>');
    expect(html).toContain('<strong>Russia</strong>');
    expect(html).toContain('<em>Kazakhstan</em>');
    expect(html).toContain(
      '<a href="https://mbbs.net/russia" target="_blank" rel="noopener noreferrer">Apply Now</a>'
    );
    expect(html).toContain(
      '<a href="https://mbbs.net/kazakhstan" target="_blank" rel="noopener noreferrer">https://mbbs.net/kazakhstan</a>'
    );
  });
});

