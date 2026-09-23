import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Icon } from '../../../../shared/ui/icon/icon';

export interface PrivacySection {
  id: string;
  number: string;
  title: string;
  category: 'General' | 'Collection' | 'Usage' | 'Security & Rights' | 'Compliance';
}

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [RouterLink, Icon, FormsModule],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicyComponent {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  readonly version = '2.1';
  readonly effectiveDate = 'September 2026';
  readonly operator = 'Preston Consultancy Edtech Private Limited';
  readonly platform = 'MBBS.net';
  readonly platformUrl = 'https://mbbs.net';

  readonly searchQuery = signal<string>('');
  readonly activeSection = signal<string>('who-we-are');

  readonly sections: PrivacySection[] = [
    { id: 'who-we-are', number: '1', title: 'Who We Are', category: 'General' },
    { id: 'information-we-collect', number: '2', title: 'Information We Collect', category: 'Collection' },
    { id: 'educational-academic-info', number: '3', title: 'Educational and Academic Information', category: 'Collection' },
    { id: 'examination-learning-data', number: '4', title: 'Examination and Learning Data', category: 'Collection' },
    { id: 'university-finder-recommendation', number: '5', title: 'University Finder and Recommendation Information', category: 'Collection' },
    { id: 'student-profiles-invites', number: '6', title: 'Student Profiles and University Invitations', category: 'Collection' },
    { id: 'chat-communication-data', number: '7', title: 'Chat and Communication Data', category: 'Collection' },
    { id: 'ai-chatbot-features', number: '8', title: 'AI and Chatbot Features', category: 'Collection' },
    { id: 'device-technical-info', number: '9', title: 'Device and Technical Information', category: 'Collection' },
    { id: 'location-info', number: '10', title: 'Location Information', category: 'Collection' },
    { id: 'push-notifications', number: '11', title: 'Push Notifications', category: 'Collection' },
    { id: 'otp-sms-whatsapp', number: '12', title: 'OTP, SMS, Email and WhatsApp Communications', category: 'Collection' },
    { id: 'cookies-technologies', number: '13', title: 'Cookies and Similar Technologies', category: 'Collection' },
    { id: 'how-we-use-info', number: '14', title: 'How We Use Personal Information', category: 'Usage' },
    { id: 'how-we-share-info', number: '15', title: 'How We Share Personal Information', category: 'Usage' },
    { id: 'international-data-processing', number: '16', title: 'International Data Processing', category: 'Security & Rights' },
    { id: 'data-security', number: '17', title: 'Data Security', category: 'Security & Rights' },
    { id: 'data-retention-deletion', number: '18', title: 'Data Retention & Account Deletion', category: 'Security & Rights' },
    { id: 'your-privacy-rights', number: '19', title: 'Your Privacy Rights', category: 'Security & Rights' },
    { id: 'children-minor-privacy', number: '20', title: "Children's & Minor Users' Privacy", category: 'Compliance' },
    { id: 'governing-privacy-laws', number: '21', title: 'Governing Privacy Laws (DPDP)', category: 'Compliance' },
    { id: 'contact-grievance-officer', number: '22', title: 'Contact & Grievance Officer', category: 'Compliance' },
  ];

  readonly filteredSections = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.sections;
    return this.sections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.number.includes(q)
    );
  });

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
