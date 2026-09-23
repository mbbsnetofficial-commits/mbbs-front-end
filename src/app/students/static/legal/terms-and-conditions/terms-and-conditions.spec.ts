import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { TermsAndConditionsComponent } from './terms-and-conditions';

describe('TermsAndConditionsComponent', () => {
  let component: TermsAndConditionsComponent;
  let fixture: ComponentFixture<TermsAndConditionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermsAndConditionsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TermsAndConditionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the terms and conditions component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the correct version and effective date', () => {
    expect(component.version).toBe('2.1');
    expect(component.effectiveDate).toBe('September 2026');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Version');
    expect(compiled.textContent).toContain('2.1');
    expect(compiled.textContent).toContain('September 2026');
  });

  it('should render all 6 sections', () => {
    expect(component.sections.length).toBe(6);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('1. Acceptance of Terms');
    expect(compiled.textContent).toContain('2. Educational Services Scope');
    expect(compiled.textContent).toContain('3. Student Accounts & Authentication');
    expect(compiled.textContent).toContain('4. Intellectual Property Rights');
    expect(compiled.textContent).toContain('5. Admissions & University Disclaimer');
    expect(compiled.textContent).toContain('6. Contact & Legal Notices');
  });

  it('should display NEET UG, UCAT, GAMSAT, MCAT, and ISAT in educational services', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('NEET UG');
    expect(compiled.textContent).toContain('UCAT');
    expect(compiled.textContent).toContain('GAMSAT');
    expect(compiled.textContent).toContain('MCAT');
    expect(compiled.textContent).toContain('ISAT');
  });

  it('should have contact emails for legal and support', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('legal@mbbs.net');
    expect(compiled.textContent).toContain('support@mbbs.net');
  });

  it('should update activeSection when scrollToSection is called', () => {
    component.scrollToSection('intellectual-property');
    expect(component.activeSection()).toBe('intellectual-property');
  });

  it('should render back button and call goBack on click', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const backBtn = compiled.querySelector('.back-btn') as HTMLButtonElement;
    expect(backBtn).toBeTruthy();
    expect(backBtn.textContent).toContain('Back');

    const goBackSpy = vi.spyOn(component, 'goBack');
    backBtn.click();
    expect(goBackSpy).toHaveBeenCalled();
  });
});
