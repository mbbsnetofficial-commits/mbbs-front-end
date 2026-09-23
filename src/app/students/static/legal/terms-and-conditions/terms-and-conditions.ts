import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Icon } from '../../../../shared/ui/icon/icon';

export interface TermsSection {
  id: string;
  number: string;
  title: string;
  icon?: string;
}

@Component({
  selector: 'app-terms-and-conditions',
  standalone: true,
  imports: [RouterLink, Icon],
  templateUrl: './terms-and-conditions.html',
  styleUrl: './terms-and-conditions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsAndConditionsComponent {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  readonly version = '2.1';
  readonly effectiveDate = 'September 2026';
  readonly activeSection = signal<string>('acceptance');

  readonly sections: TermsSection[] = [
    { id: 'acceptance', number: '1', title: 'Acceptance of Terms' },
    { id: 'educational-services', number: '2', title: 'Educational Services Scope' },
    { id: 'student-accounts', number: '3', title: 'Student Accounts & Authentication' },
    { id: 'intellectual-property', number: '4', title: 'Intellectual Property Rights' },
    { id: 'admissions-disclaimer', number: '5', title: 'Admissions & University Disclaimer' },
    { id: 'contact-notices', number: '6', title: 'Contact & Legal Notices' },
  ];

  goBack(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }

  scrollToSection(id: string): void {
    this.activeSection.set(id);
    const element = document.getElementById(id);
    if (element && typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  printPage(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
