import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  protected helpOpen = false;
  protected helpTab: 'home' | 'messages' | 'help' = 'home';
  protected helpSearch = '';
  protected activeMegaMenu: 'universities' | 'neet' | 'ucat' | null = null;

  protected readonly helpTopics = [
    'How do I contact the MBBS.net guidance team?',
    'How can I compare medical universities?',
    'Where can I find NEET counselling guidance?',
    'How do I access UCAT preparation resources?',
    'What documents are required for admission?'
  ];

  protected get filteredHelpTopics(): string[] {
    const query = this.helpSearch.trim().toLowerCase();
    return query
      ? this.helpTopics.filter((topic) => topic.toLowerCase().includes(query))
      : this.helpTopics;
  }

  protected openHelpTab(tab: 'home' | 'messages' | 'help'): void {
    this.helpTab = tab;
  }

  protected readonly megaMenus = {
    universities: {
      title: 'Universities',
      description: 'Explore recognised medical universities and compare the details that matter before applying.',
      image: '/images/medical-university-students.png',
      imageAlt: 'Medical students walking outside a university campus',
      links: ['Featured universities', 'Study MBBS abroad', 'University recognition', 'Tuition & living costs', 'Clinical exposure', 'Application guidance']
    },
    neet: {
      title: 'NEET',
      description: 'Prepare confidently and follow the latest result, counselling and medical-admission guidance.',
      image: '/images/neet-preparation.png',
      imageAlt: 'Student preparing for the NEET examination',
      links: ['NEET 2026 updates', 'Results & rank', 'Counselling guide', 'Marks vs rank', 'Required documents', 'AIQ vs state quota']
    },
    ucat: {
      title: 'UCAT Exam',
      description: 'Understand the UCAT format, build an effective preparation plan and improve your test-day readiness.',
      image: '/images/ucat-preparation.png',
      imageAlt: 'Medical-school applicant preparing for the UCAT exam',
      links: ['UCAT overview', 'Test format', 'Preparation strategy', 'Practice questions', 'Scoring guide', 'Test-day advice']
    }
  } as const;

  protected openMegaMenu(menu: 'universities' | 'neet' | 'ucat'): void {
    this.activeMegaMenu = menu;
  }

  protected closeMegaMenu(): void {
    this.activeMegaMenu = null;
  }

  protected readonly featuredUniversities = [
    { university: 'Semmelweis University', logo: '/images/universities/semmelweis.svg' },
    { university: 'University of Nicosia Medical School', logo: '/images/universities/nicosia.svg' },
    { university: 'University of Pécs Medical School', logo: '/images/universities/pecs.svg' },
    { university: 'Charles University', logo: '/images/universities/charles.svg' },
    { university: 'Lithuanian University of Health Sciences', logo: '/images/universities/lsmu.svg' },
    { university: 'Rīga Stradiņš University', logo: '/images/universities/riga-stradins.svg' },
    { university: 'Palacký University Olomouc', logo: '/images/universities/palacky.svg' },
  ];

  protected readonly creativeTeamMembers = [
    { image: 'https://images.cnippet.dev/image/upload/v1770400411/a1.jpg', name: 'Patrick Stewart', role: 'CEO - Founder' },
    { image: 'https://images.cnippet.dev/image/upload/v1770400411/a2.jpg', name: 'Alena Rosser', role: 'Director of Content' },
    { image: 'https://images.cnippet.dev/image/upload/v1770400411/a3.jpg', name: 'Fletch Skinner', role: 'Tech Manager' },
    { image: 'https://images.cnippet.dev/image/upload/v1770400411/a4.jpg', name: 'Marc Spector', role: 'Director of Content' },
    { image: 'https://images.cnippet.dev/image/upload/v1770400411/a5.jpg', name: 'Natalia Skinner', role: 'Cnippet Researcher' },
    { image: 'https://images.cnippet.dev/image/upload/v1770400411/a6.jpg', name: 'David Kim', role: 'Engineering Lead' }
  ];

}
