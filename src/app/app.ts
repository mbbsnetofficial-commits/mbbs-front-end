import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected helpOpen = false;
  protected helpTab: 'home' | 'messages' | 'help' = 'home';
  protected helpSearch = '';
  protected activeMegaMenu: 'universities' | 'neet' | 'ucat' | null = null;

  constructor(private readonly router: Router) {}

  protected get showLandingPage(): boolean {
    const path = this.router.url.split('?')[0].split('#')[0];
    return path === '/' || path.startsWith('/static');
  }

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
    { university: 'Jessenius Faculty of Medicine', logo: '/images/universities/jessenius.png' },
    { university: 'Semmelweis University', logo: '/images/universities/semmelweis.svg' },
    { university: 'University of Nicosia Medical School', logo: '/images/universities/nicosia.svg' },
    { university: 'University of Pécs Medical School', logo: '/images/universities/pecs.svg' },
    { university: 'Charles University', logo: '/images/universities/charles.svg' },
    { university: 'Lithuanian University of Health Sciences', logo: '/images/universities/lsmu.svg' },
    { university: 'Rīga Stradiņš University', logo: '/images/universities/riga-stradins.jpg' },
    { university: 'Palacký University Olomouc', logo: '/images/universities/palacky.svg' },
    { university: 'Comenius University Bratislava', logo: '/images/universities/comenius.png' }
  ];
}
