import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect } from 'vitest';
import { LandingFaq } from './landing-faq';
import { FAQ_ITEMS } from './landing-faq.model';

describe('LandingFaq Component', () => {
  let fixture: ComponentFixture<LandingFaq>;
  let component: LandingFaq;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingFaq],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingFaq);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('1. FAQ renders correctly with section heading and copy', () => {
    const section = element.querySelector('.landing-faq-section');
    expect(section).not.toBeNull();

    const eyebrow = element.querySelector('.faq-eyebrow');
    expect(eyebrow?.textContent?.trim()).toBe('FAQ');

    const heading = element.querySelector('#faq-heading');
    expect(heading?.textContent?.trim()).toBe('Questions before you begin?');

    const copy = element.querySelector('.faq-copy');
    expect(copy?.textContent).toContain('Everything you need to know about studying medicine abroad');
  });

  it('2. All curated questions render with proper index numbers (01-05)', () => {
    const items = element.querySelectorAll('.faq-item');
    expect(items.length).toBe(5);

    const questions = element.querySelectorAll('.faq-question');
    expect(questions.length).toBe(5);

    const numbers = element.querySelectorAll('.faq-num');
    expect(numbers.length).toBe(5);

    FAQ_ITEMS.forEach((item, index) => {
      expect(numbers[index].textContent?.trim()).toBe(item.num);
      expect(questions[index].textContent?.trim()).toBe(item.question);
    });
  });

  it('3. All 5 answers exist in the DOM with correct text content', () => {
    const answerElements = element.querySelectorAll('.faq-answer-text');
    expect(answerElements.length).toBe(5);

    FAQ_ITEMS.forEach((item, index) => {
      expect(answerElements[index].textContent?.trim()).toBe(item.answer);
    });
  });

  it('4. First render has all answers collapsed', () => {
    expect(component.activeId()).toBeNull();

    const triggers = element.querySelectorAll<HTMLButtonElement>('.faq-trigger');
    triggers.forEach((trigger) => {
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    const panels = element.querySelectorAll('.faq-panel');
    panels.forEach((panel) => {
      expect(panel.classList.contains('is-expanded')).toBe(false);
    });

    const items = element.querySelectorAll('.faq-item');
    items.forEach((item) => {
      expect(item.classList.contains('is-open')).toBe(false);
    });
  });

  it('5. Clicking a question expands it', () => {
    const firstTrigger = element.querySelectorAll<HTMLButtonElement>('.faq-trigger')[0];
    firstTrigger.click();
    fixture.detectChanges();

    expect(component.activeId()).toBe('faq-1');
    expect(firstTrigger.getAttribute('aria-expanded')).toBe('true');

    const firstPanel = element.querySelector('#faq-panel-faq-1');
    expect(firstPanel?.classList.contains('is-expanded')).toBe(true);

    const firstItem = element.querySelectorAll('.faq-item')[0];
    expect(firstItem.classList.contains('is-open')).toBe(true);
  });

  it('6. Clicking another question closes the previous one (single-open accordion)', () => {
    const triggers = element.querySelectorAll<HTMLButtonElement>('.faq-trigger');

    // Open first FAQ
    triggers[0].click();
    fixture.detectChanges();
    expect(component.activeId()).toBe('faq-1');
    expect(triggers[0].getAttribute('aria-expanded')).toBe('true');

    // Open second FAQ
    triggers[1].click();
    fixture.detectChanges();
    expect(component.activeId()).toBe('faq-2');
    expect(triggers[0].getAttribute('aria-expanded')).toBe('false');
    expect(triggers[1].getAttribute('aria-expanded')).toBe('true');

    const firstPanel = element.querySelector('#faq-panel-faq-1');
    const secondPanel = element.querySelector('#faq-panel-faq-2');
    expect(firstPanel?.classList.contains('is-expanded')).toBe(false);
    expect(secondPanel?.classList.contains('is-expanded')).toBe(true);
  });

  it('7. Clicking an already open question collapses it', () => {
    const firstTrigger = element.querySelectorAll<HTMLButtonElement>('.faq-trigger')[0];

    // Open
    firstTrigger.click();
    fixture.detectChanges();
    expect(component.activeId()).toBe('faq-1');

    // Close by clicking again
    firstTrigger.click();
    fixture.detectChanges();
    expect(component.activeId()).toBeNull();
    expect(firstTrigger.getAttribute('aria-expanded')).toBe('false');

    const firstPanel = element.querySelector('#faq-panel-faq-1');
    expect(firstPanel?.classList.contains('is-expanded')).toBe(false);
  });

  it('8. Plus/minus icon state changes correctly via CSS class', () => {
    const firstTrigger = element.querySelectorAll<HTMLButtonElement>('.faq-trigger')[0];
    const verticalLine = firstTrigger.querySelector('.faq-icon-v');

    // Initially collapsed: vertical line is visible (plus)
    expect(verticalLine?.classList.contains('is-hidden')).toBe(false);

    // Expand: vertical line is hidden (minus)
    firstTrigger.click();
    fixture.detectChanges();
    expect(verticalLine?.classList.contains('is-hidden')).toBe(true);

    // Collapse: vertical line is restored (plus)
    firstTrigger.click();
    fixture.detectChanges();
    expect(verticalLine?.classList.contains('is-hidden')).toBe(false);
  });

  it('9. Accessible aria-expanded and aria-controls match panel ids', () => {
    const triggers = element.querySelectorAll<HTMLButtonElement>('.faq-trigger');
    const panels = element.querySelectorAll('.faq-panel');

    triggers.forEach((trigger, index) => {
      const item = FAQ_ITEMS[index];
      expect(trigger.getAttribute('id')).toBe(`faq-trigger-${item.id}`);
      expect(trigger.getAttribute('aria-controls')).toBe(`faq-panel-${item.id}`);
      expect(panels[index].getAttribute('id')).toBe(`faq-panel-${item.id}`);
      expect(panels[index].getAttribute('aria-labelledby')).toBe(`faq-trigger-${item.id}`);
      expect(panels[index].getAttribute('role')).toBe('region');
    });
  });

  it('10. Keyboard Arrow navigation moves focus between triggers', () => {
    const triggers = element.querySelectorAll<HTMLButtonElement>('.faq-trigger');
    const lastIndex = triggers.length - 1;

    // ArrowDown from trigger 0 should focus trigger 1
    const arrowDown = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true });
    triggers[0].dispatchEvent(arrowDown);
    fixture.detectChanges();

    // ArrowUp from trigger 0 should loop to last trigger
    const arrowUp = new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true });
    triggers[0].dispatchEvent(arrowUp);
    fixture.detectChanges();

    // End key focuses last trigger
    const endKey = new KeyboardEvent('keydown', { key: 'End', cancelable: true });
    triggers[0].dispatchEvent(endKey);
    fixture.detectChanges();

    // Home key focuses first trigger
    const homeKey = new KeyboardEvent('keydown', { key: 'Home', cancelable: true });
    triggers[lastIndex].dispatchEvent(homeKey);
    fixture.detectChanges();
  });
});
