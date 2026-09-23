import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { DeleteAccountComponent } from './delete-account';

describe('DeleteAccountComponent', () => {
  let component: DeleteAccountComponent;
  let fixture: ComponentFixture<DeleteAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteAccountComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the delete account component', () => {
    expect(component).toBeTruthy();
  });

  it('should show error if identifier is empty when submitting', () => {
    component.accountIdentifier.set('');
    component.confirmUnderstood.set(true);
    component.submitDeletionRequest();
    fixture.detectChanges();

    expect(component.submissionError()).toContain('Please provide your registered WhatsApp number or email');
    expect(component.submissionSuccess()).toBe(false);
  });

  it('should show error if confirmation checkbox is not checked', () => {
    component.accountIdentifier.set('student@example.com');
    component.confirmUnderstood.set(false);
    component.submitDeletionRequest();
    fixture.detectChanges();

    expect(component.submissionError()).toContain('Please confirm that you understand');
    expect(component.submissionSuccess()).toBe(false);
  });

  it('should submit deletion request successfully and show reference code', () => {
    vi.useFakeTimers();
    component.accountIdentifier.set('+91 9876543210');
    component.confirmUnderstood.set(true);
    component.selectedReason.set('COMPLETED_EXAM');

    component.submitDeletionRequest();
    expect(component.isSubmitting()).toBe(true);

    vi.advanceTimersByTime(800);
    fixture.detectChanges();

    expect(component.isSubmitting()).toBe(false);
    expect(component.submissionSuccess()).toBe(true);
    expect(component.referenceId()).toMatch(/^DEL-[A-Z0-9]+$/);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Deletion Request Submitted Successfully');
    expect(compiled.textContent).toContain(component.referenceId());
  });

  it('should toggle FAQ items', () => {
    expect(component.faqs()[0].isOpen).toBe(false);
    component.toggleFaq(0);
    expect(component.faqs()[0].isOpen).toBe(true);
    component.toggleFaq(0);
    expect(component.faqs()[0].isOpen).toBe(false);
  });

  it('should provide pre-filled mailto link for support email', () => {
    const link = component.getMailtoLink();
    expect(link).toContain('mailto:support@mbbs.net');
    expect(link).toContain('Account%20Deletion%20Request%20-%20MBBS.NET');
  });
});
