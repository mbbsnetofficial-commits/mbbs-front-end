import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PrivacyPolicyComponent } from './privacy-policy';

describe('PrivacyPolicyComponent', () => {
  let component: PrivacyPolicyComponent;
  let fixture: ComponentFixture<PrivacyPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyPolicyComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the privacy policy component', () => {
    expect(component).toBeTruthy();
  });

  it('should display operator Preston Consultancy Edtech Private Limited', () => {
    expect(component.operator).toBe('Preston Consultancy Edtech Private Limited');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Preston Consultancy Edtech Private Limited');
  });

  it('should render all 22 sections by default', () => {
    expect(component.sections.length).toBe(22);
    expect(component.filteredSections().length).toBe(22);
  });

  it('should filter sections based on search query', () => {
    component.searchQuery.set('whatsapp');
    fixture.detectChanges();
    expect(component.filteredSections().length).toBeGreaterThan(0);
    const hasMatch = component.filteredSections().some((s) =>
      s.title.toLowerCase().includes('whatsapp')
    );
    expect(hasMatch).toBe(true);

    component.searchQuery.set('nonexistent query 12345');
    fixture.detectChanges();
    expect(component.filteredSections().length).toBe(0);
  });

  it('should display DPDP Act 2023 compliance badge', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('DPDP Act 2023 & Rules 2025 Compliant');
  });

  it('should contain contact and grievance email addresses', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('privacy@mbbs.net');
    expect(compiled.textContent).toContain('support@mbbs.net');
  });

  it('should link to delete account page in section 18', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const deleteLink = compiled.querySelector('a[href="/delete-account"]');
    expect(deleteLink).toBeTruthy();
  });
});
